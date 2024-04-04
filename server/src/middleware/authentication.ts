import { auth, JWTPayload } from 'express-oauth2-jwt-bearer';
import express from 'express';
import asyncHandler from 'express-async-handler';
import LOGGER from '../configs/logging';
import { retrieveUserInfo } from '../services/auth0';
import { APIError, Status } from '../types';

if (!process.env.BACKEND_AUDIENCE) {
  LOGGER.error('BACKEND_AUDIENCE environment variable not set');
  process.exit();
}

const ADMIN_PERMISSION = 'admin:manage';

export const checkJwt = auth({
  audience: process.env.BACKEND_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
});

// Validate if a user is an admin
const validateIsAdmin = (payload: JWTPayload) => {
  if (payload.permissions === undefined) {
    return false;
  }
  const permissions = payload.permissions as string[];
  return permissions?.includes(ADMIN_PERMISSION);
};

// Require Auth0 authentication 
export const requireAuth0User = asyncHandler(async (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
) => {
  if (!req.auth?.token) {
    throw new APIError(Status.UNAUTHORIZED, 'Missing or invalid Authorization header');
  }

  try {
    req.auth0 = {
      ...await retrieveUserInfo(req.auth.token, req.auth.payload.sub!!),
      isAdmin: validateIsAdmin(req.auth.payload),
    }; // Add the user to the request
    next(); // Continue to the next middleware
  } catch (error) {
    throw new APIError(Status.INTERNAL_SERVER_ERROR, `Failed to retrieve user info: ${error}`);
  }
});
