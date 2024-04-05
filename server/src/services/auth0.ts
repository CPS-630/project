// Check that all required environment variables are set
import { ManagementClient, UserInfoClient } from 'auth0';
import LOGGER from '../configs/logging';
import { APIError, Auth0User, Status } from '../types';
import redisClient from '../configs/cache';

if (!process.env.AUTH0_DOMAIN) {
  LOGGER.error('AUTH0_DOMAIN environment variable not set');
  process.exit();
}
if (!process.env.AUTH0_CLIENT_ID) {
  LOGGER.error('AUTH0_CLIENT_ID environment variable not set');
  process.exit();
}
if (!process.env.AUTH0_CLIENT_SECRET) {
  LOGGER.error('AUTH0_CLIENT_SECRET environment variable not set');
  process.exit();
}
if (!process.env.BACKEND_AUDIENCE) {
  LOGGER.error('BACKEND_AUDIENCE environment variable not set');
  process.exit();
}

const userInfoClient = new UserInfoClient({
  domain: process.env.AUTH0_DOMAIN!!,
});

const managementClient = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  clientId: process.env.AUTH0_CLIENT_ID,
});

export const retrieveUserInfo = async (accessToken: string, id: string) => {
  // Use the user information stored in cache if available
  const cachedUser = await redisClient.get(id);
  if (cachedUser !== null) {
    return JSON.parse(cachedUser) as Auth0User;
  }

  // Retrieve user information using the access token (JWT) that was sent in the request
  const user = await userInfoClient
    .getUserInfo(accessToken).then((u) => {
      if (u.status !== 200) {
        LOGGER.error(u.statusText);
        throw new APIError(
          Status.INTERNAL_SERVER_ERROR,
          'Failed to retrieve user info',
        );
      }

      return {
        id: u.data.sub,
        email: u.data.email,
        firstName: u.data.given_name,
        lastName: u.data.family_name,
        picture: u.data.picture,
      };
    });

  // set user in cache for 5 min
  await redisClient.setEx(id, 300, JSON.stringify(user));
  return user;
};

export const retrieveAuth0Users = async (options?: {
  name?: string;
  email?: string;
}): Promise<Array<Auth0User>> => {
  let query = options?.name ? `name:*${options.name}*` : '';
  query += options?.email ? `email:*${options.email}*` : '';

  return managementClient.users.getAll({
    q: query,
  }).then((users) => {
    if (users.status !== 200) {
      throw new APIError(
        Status.INTERNAL_SERVER_ERROR,
        'Failed to retrieve users',
        users.statusText,
      );
    }

    return users.data.map((user) => ({
      id: user.user_id,
      email: user.email,
      firstName: user.given_name,
      lastName: user.family_name,
      picture: user.picture,
    }));
  });
};

export const retrieveAuth0User = async (id: string): Promise<Auth0User> => {
  // Use the user information stored in cache if available
  const cachedUser = await redisClient.get(id);
  if (cachedUser !== null) {
    return JSON.parse(cachedUser) as Auth0User;
  }

  // Retrieve user information from Auth0
  const user = await managementClient
    .users.get({ id }).then((u) => {
      if (u.status !== 200) {
        throw new APIError(
          Status.INTERNAL_SERVER_ERROR,
          'Failed to retrieve user',
          u.statusText,
        );
      }
      return {
        id: u.data.user_id,
        email: u.data.email,
        firstName: u.data.given_name,
        lastName: u.data.family_name,
        picture: u.data.picture,
      };
    });

  // store user information in the cache for 5 minutes.
  redisClient.setEx(id, 300, JSON.stringify(user)).then(() => {
    LOGGER.debug(`User ${id} stored in cache`);
  });
  return user;
};
