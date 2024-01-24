export enum ButtonType {
  Primary = 'primary',
  Normal = 'normal',
  Link = 'link',
  Danger = 'danger',
}

export enum ToastType {
  Error = 'error',
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
}

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};
