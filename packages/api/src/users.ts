import { z } from './zod';
import { DateRegex, SortOrder, UserRole } from './constants';
import { ProfileSchema, UserSchema } from './user';

export enum UsersSortBy {
  Username = 'username',
  MemberSince = 'memberSince',
}

export const SearchUsersParamsSchema = z
  .object({
    query: z.string().trim().max(200),
    sortBy: z.nativeEnum(UsersSortBy).default(UsersSortBy.Username),
    sortOrder: z.nativeEnum(SortOrder).default(SortOrder.Ascending),
    skip: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().positive().max(200).default(100),
  })
  .partial();
export type SearchUsersParams = z.infer<typeof SearchUsersParamsSchema>;

export const SearchUsersResponseSchema = z.object({
  users: UserSchema.array().openapi({
    title: 'Search Results',
    description: 'An array containing the users that matched the search query.',
  }),
  totalCount: z.number().int().openapi({
    title: 'Total Count',
    description: 'The total number of users that matched the search query.',
  }),
});
export type SearchUsersResponseDTO = z.infer<typeof SearchUsersResponseSchema>;

export const SearchProfilesResponseSchema = z.object({
  profiles: ProfileSchema.array().openapi({
    title: 'Search Results',
    description:
      'An array containing the profiles that matched the search query.',
  }),
  totalCount: z.number().int().openapi({
    title: 'Total Count',
    description: 'The total number of profiles that matched the search query.',
  }),
});
export type SearchProfilesResponseDTO = z.infer<
  typeof SearchProfilesResponseSchema
>;
