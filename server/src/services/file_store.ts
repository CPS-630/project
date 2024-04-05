import {
  DeleteObjectsCommand, GetObjectCommand, ListObjectsCommand, PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_BUCKET_NAME, S3_PUBLIC_URL, s3Client } from '../configs/s3';
import { getPost } from './posts';
import { APIError, Auth0User, Status } from '../types';
import LOGGER from '../configs/logging';
import redisClient from '../configs/cache';

export const uploadImages = async (
  postId: number,
  auth0Id: string,
  images: Express.Multer.File[],
): Promise<void> => {
  const post = await getPost(postId);
  if (post.user.id !== auth0Id) {
    throw new APIError(Status.FORBIDDEN, 'You are not authorized to upload images for this post');
  }

  // Uploads each image to the S3 bucket under a distinct post-{id} folder.
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
  // Use the cached image URLs if available.
  const contentObjects = await redisClient.get(`post-${postId}`);
  if (contentObjects !== null) {
    return JSON.parse(contentObjects) as string[];
  }

  const { Contents } = await s3Client.send(new ListObjectsCommand({
    Bucket: S3_BUCKET_NAME,
    Prefix: `post-${postId}/`,
  }));

  if (!Contents) {
    redisClient.setEx(`post-${postId}`, 86400, JSON.stringify([])).then(() => {
      LOGGER.debug(`Cached S3 image list for post ${postId}`);
    });
    return [];
  }
  // Construct the public URL for each image without signing
  const imageURLs = await Promise.all(Contents.map(async ({ Key }) => {
    // In production, we need to sign the image URL to allow access. This is necessary for security.
    if (process.env.ENVIRONMENT === 'prod') {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key,
      });
      return getSignedUrl(s3Client, command, { expiresIn: 86400 });
    }
    return `${S3_PUBLIC_URL}/${Key}`;
  }));

  // Cache the image URLs for 24 hours
  redisClient.setEx(`post-${postId}`, 86400, JSON.stringify(imageURLs)).then(() => {
    LOGGER.debug(`Cached S3 image list for post ${postId}`);
  });
  return imageURLs;
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
