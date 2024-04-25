import './configs/dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import AppDataSource from './configs/db';
import { messageRoutes, postRoutes, userRoutes } from './routes';
import LOGGER from './configs/logging';
import errorHandler from './middleware/error_handler';
import { setupBucketAndPolicy } from './configs/s3';
import conversationRoutes from './routes/conversations';
import metricsMiddleware from './middleware/metrics';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(metricsMiddleware);
app.use(bodyParser.json());

app.use('/user', userRoutes);
app.use('/post', postRoutes);

app.use('/message', messageRoutes);
app.use('/conversation', conversationRoutes);
app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    // here you can start to work with your database
    LOGGER.debug('Successfully connected to database');
    app.listen(PORT, () => {
      LOGGER.info('TMU Connect server listening on PORT 8080.');
    });

    void setupBucketAndPolicy();
  })
  .catch((error) => {
    LOGGER.fatal(`Could not connect to database: ${error}`);
  });
