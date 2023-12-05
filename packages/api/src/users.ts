import { z } from './zod';
import { DateRegex, SortOrder, UserRole } from './constants';

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
