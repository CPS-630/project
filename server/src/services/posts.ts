import { Post } from '../entities';
import AppDataSource from '../configs/db';
import { getUser } from './users';
import {
  AdType, APIError, Auth0User, Status,
} from '../types';
import LOGGER from '../configs/logging';

interface CreatePostRequest {
  title: string;
  adType: AdType;
  description: string;
  location: string;
  categories: string[];
  price: number;
}

interface GetPostQuery {
  category?: string[];
  adType?: string[];
  location?: string;
  title?: string;
  sort?: string;
}

export const createPost = async (
  auth0Id: string,
  postRequest: CreatePostRequest,
): Promise<number> => {
  const user = await getUser(auth0Id);
  const postRepository = AppDataSource.getRepository(Post);
  const post = postRepository.create({
    ...postRequest,
    user,
  });
  const result = await postRepository.insert(post);
  return result.identifiers[0].id;
};

export const getPost = async (postID: number): Promise<Post> => {
  const post = await AppDataSource.getRepository(Post)
    .findOne({
      where: { id: postID },
      relations: ['user'],
    });

  if (!post) {
    throw new APIError(
      Status.NOT_FOUND,
      `Post with id ${postID} does not exist`,
    );
  }
  return post;
};

export const getPostsByQuery = async (query: GetPostQuery): Promise<Post[]> => {
  let queryBuilder = AppDataSource
    .getRepository(Post)
    .createQueryBuilder('post')
    .where('LOWER(title) LIKE LOWER(:title)', { title: `%${query.title || ''}%` })
    .andWhere('LOWER(location) LIKE LOWER(:location)', { location: `%${query.location || ''}%` })
    .andWhere('categories @> :categories', { categories: query.category || [] });

  if (query.adType && query.adType.length > 0) {
    queryBuilder = queryBuilder.andWhere('ad_type = ANY(:adTypes)', { adTypes: query.adType });
  }
  if (query.sort && query.sort !== '') {
    const [field, order] = query.sort.split('|');
    if (order === 'DESC') {
      queryBuilder = queryBuilder.orderBy(field, 'DESC');
    } else {
      queryBuilder = queryBuilder.orderBy(field, 'ASC');
    }
  }

  return queryBuilder.getMany();
};

export const getUserPosts = async (userID: string): Promise<Post[]> => AppDataSource
  .getRepository(Post)
  .createQueryBuilder()
  .where('user_id = :userId', { userId: userID })
  .getMany();

export const getLocations = async (): Promise<Post[]> => AppDataSource
  .getRepository(Post)
  .createQueryBuilder('post')
  .select('location')
  .distinct(true)
  .getRawMany();

export const deletePost = async (auth0User: Auth0User, postID: number): Promise<void> => {
  const user = await getUser(auth0User.id);
  const post = await getPost(postID);

  // A post can only be deleted by the user who created it or an admin
  if (user.id !== post.user.id && !auth0User.isAdmin) {
    throw new APIError(
      Status.FORBIDDEN,
      'User does not have permission to delete this post',
    );
  }

  const result = await AppDataSource.getRepository(Post)
    .createQueryBuilder()
    .delete()
    .where('id = :id', { id: postID })
    .execute();

  if (result.affected === 0) {
    LOGGER.info(`Delete post failed for id ${postID} because no rows were deleted`);
  }
};
