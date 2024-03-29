import router from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { checkJwt, requireAuth0User } from '../middleware/authentication';
import {
  deleteUser, getUser, retrieveUsersBy, setupUser, updateUser,
} from '../services/users';
import { User } from '../entities';
import { Status } from '../types';

const userRoutes = router();

userRoutes.use(checkJwt, requireAuth0User);

const userSchema = z.object({
  phoneNumber: z.string().regex(/^\+[0-9]{10,15}$/, 'Phone number must be a valid E.164 number'),
  major: z.string().regex(/^[A-Za-z ]+$/, 'Major should only include letters'),
  year: z.number().min(1).int('Year must be a whole number'),
});

const userQuerySchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().min(3).optional(),
  year: z.coerce.number().int().optional(),
  major: z.string().optional(),
});

userRoutes.put('/setup', asyncHandler(async (req, res) => {
  const parsedBody = userSchema.parse(req.body);
  const user = new User(req.auth0?.id!!, parsedBody.phoneNumber, parsedBody.major, parsedBody.year);
  await setupUser(user);
  res.status(Status.CREATED).json(user);
}));

userRoutes.post('/update', asyncHandler(async (req, res) => {
  const parsedBody = userSchema.parse(req.body);
  const user = await updateUser(
    new User(req.auth0?.id!!, parsedBody.phoneNumber, parsedBody.major, parsedBody.year),
  );
  res.status(Status.OK).json(user);
}));

userRoutes.get('/:id', asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);
  res.status(Status.OK).json({
    ...req.auth0!!,
    ...user,
  });
}));

userRoutes.get('/', asyncHandler(async (req, res) => {
  const queryParams = userQuerySchema.parse(req.query);
  const users = await retrieveUsersBy(queryParams);
  res.status(Status.OK).json(users);
}));

userRoutes.delete('/:id', asyncHandler(async (req, res) => {
  await deleteUser(req.auth0!!, req.params.id);
  res.status(Status.OK);
}));

export default userRoutes;
