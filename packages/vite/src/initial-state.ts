import {
  AdminSearchUsersResponseDTO,
  DiveSiteDTO,
  SearchDiveSitesResponseDTO,
  UserDTO,
} from '@bottomtime/api';

export type AppInitialState = {
  adminCurrentUser?: UserDTO;
  adminUsersList?: AdminSearchUsersResponseDTO;
  currentDiveSite?: DiveSiteDTO | null;
  currentUser: UserDTO | null;
  diveSites?: SearchDiveSitesResponseDTO;
};

export function useInitialState(): AppInitialState | null {
  if (typeof window === 'undefined') return null;
  else return window.__INITIAL_STATE__;
}
