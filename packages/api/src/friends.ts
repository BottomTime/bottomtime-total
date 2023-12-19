import { SortOrder } from './constants';
import { z } from './zod';

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
  friends: FriendSchema.array().openapi({
    title: 'Friends',
    description: "An array containing the user's friends.",
  }),
  totalCount: z.number().int().openapi({
    title: 'Total Count',
    description: 'The total number of friends associated with the user.',
    example: 70,
  }),
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
  friendRequests: FriendRequestSchema.array().openapi({
    title: 'Friend Requests',
    description: "An array containing the user's friend requests.",
  }),
  totalCount: z.number().int().openapi({
    title: 'Total Count',
    description:
      'The total number of friend requests associated with the user.',
  }),
});
export type ListFriendRequestsResponseDTO = z.infer<
  typeof ListFriendRequestsResponseSchema
>;

// Acknowledging Friend Requests
export const AcknowledgeFriendRequestParamsSchema = z.discriminatedUnion(
  'accepted',
  [
    z.object({
      accepted: z.literal(true).openapi({
        title: 'Accept Request',
        description:
          'Indicates whether the friend request should be accepted. A value of true accepts the request and a value of false declines the request.',
      }),
    }),
    z.object({
      accepted: z.literal(false).openapi({
        title: 'Accept Request',
        description:
          'Indicates whether the friend request should be accepted. A value of true accepts the request and a value of false declines the request.',
      }),
      reason: z.string().optional(),
    }),
  ],
);
export type AcknowledgeFriendRequestParamsDTO = z.infer<
  typeof AcknowledgeFriendRequestParamsSchema
>;
