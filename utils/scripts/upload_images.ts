import { config } from 'dotenv';
import pgp from 'pg-promise';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { faker } from '@faker-js/faker';

config();

const DB = pgp()({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET || 'tmu-connect';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!!,
    secretAccessKey: process.env.S3_SECRET_KEY!!,
  },
  forcePathStyle: true,
});

const uploadPlaceholders = async (): Promise<void> => {
  const postIds = await DB.many<{ id: string }>('SELECT id FROM posts WHERE user_id LIKE $1', ['auth0%']);
  await Promise.all(postIds.map(async ({ id }) => {
    const imageUrl = faker.image.urlPicsumPhotos();
    const imageBuffer = await fetch(imageUrl).then((r) => r.arrayBuffer());
    return s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: `post-${id}/placeholder.jpg`,
      Body: Buffer.from(imageBuffer),
      ACL: 'public-read',
    }));
  }));
};

uploadPlaceholders().then(() => {
  console.log('=== SUCCESSFULLY UPLOADED PLACEHOLDER IMAGES');
});
