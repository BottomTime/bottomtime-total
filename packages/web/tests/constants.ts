export const ConfirmDialog = {
  Confirm: '[data-testid="dialog-confirm-button"]',
  Cancel: '[data-testid="dialog-cancel-button"]',
} as const;

export const DrawerPanel = {
  CloseButton: '[data-testid="drawer-close"]',
  Edit: '[data-testid="drawer-edit"]',
  Fullscreen: '[data-testid="drawer-fullscreen"]',
  Title: '[data-testid="drawer-title"]',
} as const;

export const RequireAuth = {
  LoginForm: '[data-testid="login-form"]',
  ForbiddenMessage: '[data-testid="forbidden-message"]',
} as const;

export const NotFoundMessage = '[data-testid="not-found-message"]';
