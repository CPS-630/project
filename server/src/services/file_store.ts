import {
  DeleteObjectsCommand, GetObjectCommand, ListObjectsCommand, PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_BUCKET_NAME, S3_PUBLIC_URL, s3Client } from '../configs/s3';
import { getPost } from './posts';
import { APIError, Auth0User, Status } from '../types';
import LOGGER from '../configs/logging';

export const uploadImages = async (
  postId: number,
  auth0Id: string,
  images: Express.Multer.File[],
): Promise<void> => {
  const post = await getPost(postId);
  if (post.user.id !== auth0Id) {
    throw new APIError(Status.FORBIDDEN, 'You are not authorized to upload images for this post');
  }

  const promises = images.map((image) => s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: `post-${postId}/${image.originalname}`,
    Body: image.buffer,
    ACL: 'public-read',
  })));
  await Promise.all(promises);
  LOGGER.debug(`Uploaded ${images.length} images for post ${postId}`);
};

export const getImageURLs = async (postId: number): Promise<string[]> => {
  const { Contents } = await s3Client.send(new ListObjectsCommand({
    Bucket: S3_BUCKET_NAME,
    Prefix: `post-${postId}/`,
  }));

  if (!Contents) {
    return [];
  }
  // Construct the public URL for each image without signing
  return Promise.all(Contents.map(async ({ Key }) => {
    if (process.env.ENVIRONMENT === 'prod') {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key,
      });
      return getSignedUrl(s3Client, command, { expiresIn: 120 });
    }
    return `${S3_PUBLIC_URL}/${Key}`;
  }));
};

export const deletePostImages = async (auth0User: Auth0User, postId: number): Promise<void> => {
  const post = await getPost(postId);
  if (post.user.id !== auth0User.id && !auth0User.isAdmin) {
    throw new APIError(Status.FORBIDDEN, 'You are not authorized to delete images for this post');
  }

  const { Contents } = await s3Client.send(new ListObjectsCommand({
    Bucket: S3_BUCKET_NAME,
    Prefix: `post-${postId}/`,
  }));

  if (!Contents) {
    return;
  }

  await s3Client.send(new DeleteObjectsCommand({
    Bucket: S3_BUCKET_NAME,
    Delete: {
      Objects: Contents.map(({ Key }) => ({ Key })),
    },
  }));
  LOGGER.debug(`Deleted images for post ${postId}`);
};
