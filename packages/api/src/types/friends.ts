import { z } from 'zod';

import { BooleanString, SortOrder } from './constants';
import { LogBookSharing } from './users';

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
  logBookSharing: z.nativeEnum(LogBookSharing),
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
export type ListFriendsParamsDTO = z.infer<typeof ListFriendsParamsSchema>;

export const ListFriendsResposneSchema = z.object({
  data: FriendSchema.array(),
  totalCount: z.number().int(),
});

// Listing Friend Requests
export const ListFriendRequestsParamsSchema = z
  .object({
    direction: z.nativeEnum(FriendRequestDirection),
    showAcknowledged: BooleanString,
    showExpired: BooleanString,
    skip: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().min(1).max(200),
  })
  .partial();
export type ListFriendRequestsParamsDTO = z.infer<
  typeof ListFriendRequestsParamsSchema
>;

export const ListFriendRequestsResponseSchema = z.object({
  data: FriendRequestSchema.array(),
  totalCount: z.number().int(),
});

// Acknowledging Friend Requests
export const AcknowledgeFriendRequestParamsSchema = z.discriminatedUnion(
  'accepted',
  [
    z.object({
      accepted: z.literal(true),
    }),
    z.object({
      accepted: z.literal(false),
      reason: z.string().max(500).optional(),
    }),
  ],
);
export type AcknowledgeFriendRequestParamsDTO = z.infer<
  typeof AcknowledgeFriendRequestParamsSchema
>;
