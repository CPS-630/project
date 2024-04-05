import { Conversation } from '../entities';
import AppDataSource from '../configs/db';
import { APIError, Status } from '../types';
import { getUser } from './users';
import { getPost } from './posts';
import LOGGER from '../configs/logging';

const hasConversation = async (postId: number, userId: string): Promise<boolean> => {
  const conversationRepository = AppDataSource.getRepository(Conversation);
  return conversationRepository.existsBy({ post: { id: postId }, buyer: { id: userId } });
};

export const createConversation = async (
  postId: number,
  buyerId: string, // auth0 id
): Promise<Conversation> => {
  if (await hasConversation(postId, buyerId)) {
    throw new APIError(Status.BAD_REQUEST, 'Conversation already exists for this post and user');
  }

  const post = await getPost(postId);
  if (!post) {
    LOGGER.info(`Post with id ${postId} not found`);
    throw new APIError(Status.BAD_REQUEST, `Post with id ${postId} not found`);
  }
  const sellerId = post.user.id;

  if (sellerId === buyerId) {
    throw new APIError(Status.BAD_REQUEST, 'Seller and buyer cannot be the same user');
  }

  if (post.user.id !== sellerId) {
    LOGGER.info(`Seller with id ${sellerId} is not the seller of post with id ${postId}`);
    throw new APIError(Status.BAD_REQUEST, `Seller with id ${sellerId} is not the seller of post with id ${postId}`);
  }

  const seller = await getUser(sellerId);
  if (!seller) {
    LOGGER.info(`Seller with id ${sellerId} not found`);
    throw new APIError(Status.BAD_REQUEST, `Seller with id ${sellerId} not found`);
  }

  const buyer = await getUser(buyerId);
  if (!buyer) {
    LOGGER.info(`Buyer with id ${buyerId} not found`);
    throw new APIError(Status.BAD_REQUEST, `Buyer with id ${buyerId} not found`);
  }

  const conversationRepository = AppDataSource.getRepository(Conversation);
  const conversation = conversationRepository.create({
    post,
    seller,
    buyer,
  });

  await conversationRepository.save(conversation);
  return conversation;
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  const conversationRepository = AppDataSource.getRepository(Conversation);

  // Fetch conversations where the user is either the seller or the buyer
  return conversationRepository
    .createQueryBuilder('conversation')
    .leftJoinAndSelect('conversation.post', 'post')
    .leftJoinAndSelect('conversation.seller', 'seller')
    .leftJoinAndSelect('conversation.buyer', 'buyer')
    .where('conversation.seller = :userId OR conversation.buyer = :userId', { userId })
    .getMany();
};

export const getConversationByPost = async (
  postId: number,
  userId: string,
): Promise<Conversation> => {
  const conversationRepository = AppDataSource.getRepository(Conversation);
  const conversation = await conversationRepository.findOne({
    where: { post: { id: postId }, buyer: { id: userId } },
    relations: ['post', 'seller', 'buyer'], // Load relations if necessary
  });

  if (!conversation) {
    throw new APIError(Status.NOT_FOUND, `Conversation for post with ID ${postId} not found`);
  }
  return conversation;
};

export const deleteConversation = async (
  postId: number,
  userId: string,
): Promise<void> => {
  const conversationRepository = AppDataSource.getRepository(Conversation);
  const conversation = await conversationRepository.findOne({
    where: [
      { post: { id: postId }, buyer: { id: userId } },
      { post: { id: postId }, seller: { id: userId } },
    ],
  });

  if (!conversation) {
    throw new APIError(Status.NOT_FOUND, `Conversation for post with ID ${postId} not found`);
  }

  if (conversation?.buyer.id !== userId && conversation.seller.id !== userId) {
    throw new APIError(Status.NOT_FOUND, 'User is not a part of this conversation.');
  }

  const result = await AppDataSource.getRepository(Conversation)
    .createQueryBuilder()
    .delete()
    .where('id = :id', { id: conversation.id })
    .execute();

  if (result.affected === 0) {
    LOGGER.info(`Delete conversation failed for id ${conversation.id} because no rows were deleted`);
  }
};
