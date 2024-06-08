import {
  AdminSearchUsersResponseDTO,
  AlertDTO,
  DiveSiteDTO,
  ListAlertsResponseDTO,
  ListFriendRequestsResponseDTO,
  ListFriendsResponseDTO,
  ListLogEntriesResponseDTO,
  ListTanksResponseDTO,
  LogEntryDTO,
  ProfileDTO,
  SearchDiveSitesResponseDTO,
  TankDTO,
  UserDTO,
} from '@bottomtime/api';

export type AppInitialState = {
  adminCurrentUser?: UserDTO;
  adminUsersList?: AdminSearchUsersResponseDTO;
  alerts?: ListAlertsResponseDTO;
  currentAlert?: AlertDTO;
  currentDiveSite?: DiveSiteDTO | null;
  currentLogEntry?: LogEntryDTO;
  currentUser: UserDTO | null;
  currentProfile?: ProfileDTO;
  currentTank?: TankDTO;
  error?: unknown;
  friends?: ListFriendsResponseDTO;
  friendRequests?: ListFriendRequestsResponseDTO;
  diveSites?: SearchDiveSitesResponseDTO;
  logEntries?: ListLogEntriesResponseDTO | 'not-found' | 'forbidden';
  tanks?: ListTanksResponseDTO;
};

export function useInitialState(): AppInitialState | null {
  if (typeof window === 'undefined') return null;
  else return window.__INITIAL_STATE__;
}
