import { ErrorResponseDTO } from '@bottomtime/api';

import { AxiosError, AxiosHeaders } from 'axios';

const Config = {
  headers: new AxiosHeaders(),
};

export function createAxiosError(
  message: string | ErrorResponseDTO,
): AxiosError {
  if (typeof message === 'string') {
    return new AxiosError(message, 'ECONNECT', Config, undefined, undefined);
  }

  return new AxiosError(message.message, undefined, Config, undefined, {
    data: message,
    status: message.status ?? 500,
    statusText: '',
    headers: {},
    config: Config,
    request: {},
  });
}

export function createNetworkError(message?: string) {
  return createAxiosError(message || 'Network Error');
}
