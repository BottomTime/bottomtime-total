import { ErrorResponseDTO, HttpException } from '@bottomtime/api';

export function createHttpError(
  statusOrBody: number | ErrorResponseDTO,
): HttpException {
  return typeof statusOrBody === 'number'
    ? new HttpException(statusOrBody, '', 'Nope!', {
        status: statusOrBody,
        message: 'Nope!',
        method: 'GET',
        path: '/',
      })
    : new HttpException(
        statusOrBody.status,
        '',
        statusOrBody.message,
        statusOrBody,
      );
}
