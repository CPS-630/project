import express from 'express';
import { UnauthorizedError } from 'express-oauth2-jwt-bearer';
import { ZodError } from 'zod';
import LOGGER from '../configs/logging';
import { APIError, Status } from '../types';

// Handle errors w/ frontend and backend communication
const errorMiddleware = (
  err: Error,
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void => {
  LOGGER.info(err.message, err.stack);
  if (err instanceof UnauthorizedError) {
    res.status(Status.UNAUTHORIZED).json({
      code: Status.UNAUTHORIZED,
      message: `Unauthorized ${err.message}`,
    });
    return next();
  }
  if (err instanceof ZodError) {
    res.status(Status.BAD_REQUEST).json({
      code: Status.BAD_REQUEST,
      message: `Bad Request: ${err.errors[0].message}`,
    });
  }
  if (err instanceof APIError) {
    res.status(err.status).json({
      code: err.status,
      message: err.message,
    });
    return next();
  }

  res.status(Status.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
  return next();
};

export default errorMiddleware;
