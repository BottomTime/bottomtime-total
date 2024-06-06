import { ErrorResponseDTO } from '@bottomtime/api';

import { AxiosError, AxiosHeaders } from 'axios';

const Config = {
  headers: new AxiosHeaders(),
};

export function createAxiosError(
  messageOrStatus: string | number | ErrorResponseDTO,
): AxiosError {
  if (typeof messageOrStatus === 'string') {
    return new AxiosError(
      messageOrStatus,
      'ECONNECT',
      Config,
      undefined,
      undefined,
    );
  }

  if (typeof messageOrStatus === 'number') {
    const data: ErrorResponseDTO = {
      message: 'Nope',
      method: 'GET',
      path: '/api/route',
      status: messageOrStatus,
    };
    return new AxiosError('Error', undefined, Config, undefined, {
      data,
      status: messageOrStatus,
      statusText: '',
      headers: {},
      config: Config,
      request: {},
    });
  }

  return new AxiosError(messageOrStatus.message, undefined, Config, undefined, {
    data: messageOrStatus,
    status: messageOrStatus.status ?? 500,
    statusText: '',
    headers: {},
    config: Config,
    request: {},
  });
}

export function createNetworkError(message?: string) {
  return createAxiosError(message || 'Network Error');
}
