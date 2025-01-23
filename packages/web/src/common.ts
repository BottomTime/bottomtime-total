import { ComputedRef } from 'vue';

export type Breadcrumb = {
  label: string | ComputedRef<string>;
  to?: string | ComputedRef<string>;
  active?: boolean;
};

export type Coordinates = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const DateTimeFormat = 'yyyy-MMM-dd hh:mm:ss a';

export type SelectOption = {
  disabled?: boolean;
  label?: string;
  value: string;
};

export type TabInfo = {
  key: string;
  label: string;
  disabled?: boolean;
  visible?: boolean;
};

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

export type Selectable<T> = T & { selected?: boolean };
