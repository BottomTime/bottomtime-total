import {
  AdminSearchUsersResponseDTO,
  AlertDTO,
  DiveSiteDTO,
  ListAlertsResponseDTO,
  ListFriendRequestsResponseDTO,
  ListFriendsResponseDTO,
  LogEntryDTO,
  ProfileDTO,
  SearchDiveSitesResponseDTO,
  UserDTO,
} from '@bottomtime/api';

export type AppInitialState = {
  adminCurrentUser?: UserDTO;
  adminUsersList?: AdminSearchUsersResponseDTO;
  alerts?: ListAlertsResponseDTO;
  currentAlert?: AlertDTO;
  currentDiveSite?: DiveSiteDTO | null;
  currentUser: UserDTO | null;
  currentProfile?: ProfileDTO;
  error?: unknown;
  friends?: ListFriendsResponseDTO;
  friendRequests?: ListFriendRequestsResponseDTO;
  diveSites?: SearchDiveSitesResponseDTO;
  logEntries?: LogEntryDTO;
};

export function useInitialState(): AppInitialState | null {
  if (typeof window === 'undefined') return null;
  else return window.__INITIAL_STATE__;
}
