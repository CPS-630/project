import { createClient } from 'redis';
import LOGGER from './logging';

const redisClient = createClient({
  url: process.env.REDISCLOUD_URL || '',
});

redisClient.on('error', (err) => {
  LOGGER.error('Redis error: ', err);
  process.exit(1);
});

const initializeRedisConnection = async () => {
  await redisClient.connect();
  LOGGER.info('Connected to Redis');
};

initializeRedisConnection()
  .catch((err) => LOGGER.error('Failed to connect to Redis: ', err));

export default redisClient;
