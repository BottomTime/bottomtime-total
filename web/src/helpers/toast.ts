export const CommonToasts = {} as const;

export const ToastType = {
  Error: 'is-danger',
  Info: 'is-info',
  Success: 'is-success',
  Warning: 'is-warning',
} as const;

export interface Toast {
  id: string;
  type: string;
  message: string;
  description?: string;
  timer?: NodeJS.Timeout;
}
