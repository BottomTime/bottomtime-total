import { SortOrder } from './constants';
import { z } from 'zod';

export enum FriendsSortBy {
  Username = 'username',
  MemberSince = 'memberSince',
  FriendsSince = 'friendsSince',
}

export enum FriendRequestDirection {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
  Both = 'both',
}

// Data Transfer Objects
export const FriendSchema = z.object({
  id: z.string().uuid(),
  friendsSince: z.coerce.date(),
  username: z.string(),
  memberSince: z.coerce.date(),
  avatar: z.string().optional(),
  name: z.string().optional(),
  location: z.string().optional(),
});
export type FriendDTO = z.infer<typeof FriendSchema>;

export const FriendRequestSchema = z.object({
  friendId: z.string().uuid(),
  direction: z.nativeEnum(FriendRequestDirection),
  created: z.coerce.date(),
  expires: z.coerce.date(),
  friend: FriendSchema.omit({ friendsSince: true }),
  accepted: z.boolean().optional(),
  reason: z.string().optional(),
});
export type FriendRequestDTO = z.infer<typeof FriendRequestSchema>;

// Listing Friends
export const ListFriendsParamsSchema = z
  .object({
    sortBy: z.nativeEnum(FriendsSortBy),
    sortOrder: z.nativeEnum(SortOrder),
    skip: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().min(1).max(100),
  })
  .partial();
export type ListFriendsParams = z.infer<typeof ListFriendsParamsSchema>;

export const ListFriendsResposneSchema = z.object({
  friends: FriendSchema.array(),
  totalCount: z.number().int(),
});
export type ListFriendsResponseDTO = z.infer<typeof ListFriendsResposneSchema>;

// Listing Friend Requests
export const ListFriendRequestsParamsSchema = z
  .object({
    direction: z
      .nativeEnum(FriendRequestDirection)
      .default(FriendRequestDirection.Both),
    skip: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .partial();
export type ListFriendRequestsParams = z.infer<
  typeof ListFriendRequestsParamsSchema
>;

export const ListFriendRequestsResponseSchema = z.object({
  friendRequests: FriendRequestSchema.array(),
  totalCount: z.number().int(),
});
export type ListFriendRequestsResponseDTO = z.infer<
  typeof ListFriendRequestsResponseSchema
>;

// Acknowledging Friend Requests
export const AcknowledgeFriendRequestParamsSchema = z.discriminatedUnion(
  'accepted',
  [
    z.object({
      accepted: z.literal(true),
    }),
    z.object({
      accepted: z.literal(false),
      reason: z.string().optional(),
    }),
  ],
);
export type AcknowledgeFriendRequestParamsDTO = z.infer<
  typeof AcknowledgeFriendRequestParamsSchema
>;
