import { ResponseError as HttpError } from 'superagent';
import { Router } from 'vue-router';
import { Store } from 'vuex';

import { BTState, Dispatch } from '../store';
import { Toast, ToastType } from './toast';

export type HttpCodeHandlers = {
  [status: number]: (error: HttpError) => void | Promise<void>;
};

export type ErrorHandlingHOF = (
  fn: () => void | Promise<void>,
  overrides?: HttpCodeHandlers,
) => Promise<void>;

interface NetworkError {
  errno: number;
  code: string;
  syscall: string;
  address: string;
  port: number;
}

function isNetworkError(data: any): data is NetworkError {
  return (
    typeof data.errno === 'number' &&
    typeof data.code === 'string' &&
    typeof data.syscall === 'string'
  );
}

function isHttpError(data: any): data is HttpError {
  return data.response && typeof data.status === 'number';
}

function logHttpError(error: HttpError) {
  try {
    console.error(
      `HTTP ${error.status} error:`,
      JSON.parse(error.response?.text ?? '{}'),
    );
  } catch {
    console.error(`HTTP ${error.status} error:`, error.response?.text);
  }
}

export const BadRequestToast: Toast = {
  id: 'bad-request-error',
  type: ToastType.Error,
  message: 'Bad Request Error',
  description:
    "This is odd. The server rejected your request. This shouldn't happen but you can try checking the values you've entered for correctness and trying again.",
};

export const ForbiddenErrorToast: Toast = {
  id: 'forbidden-error',
  type: ToastType.Error,
  message: 'Nope!',
  description: 'You are not authorized to perform the requested action.',
};

export const NotFoundToast: Toast = {
  id: 'not-found-error',
  type: ToastType.Error,
  message: 'Not Found',
  description:
    'The resource you are looking for cannot be found. You action could not be completed.',
};

export const ServerErrorToast: Toast = {
  id: 'server-error',
  type: ToastType.Error,
  message: 'Unexpected Server Error',
  description:
    "An unexpected server error has occurred. This is a problem on our end but, rest assured, we're on it! Please check back later.",
};

export const UnexpectedExceptionToast: Toast = {
  id: 'unexpected-exception',
  type: ToastType.Error,
  message: 'An Unexpected Error Has Occurred',
  description:
    "Well, this is embarrassing... the code did something it wasn't supposed to. Please contact support and try to describe what you were doing when the error occurred.",
};

export function createErrorHandler(store: Store<BTState>): ErrorHandlingHOF {
  const defaultHttpErrorHandlers: HttpCodeHandlers = {
    [400]: async () => {
      await store.dispatch(Dispatch.Toast, BadRequestToast);
    },
    [401]: async () => {
      // 401... user is not signed in. This probably happened because the session expired. Sign the user out so
      // that they see the login form.
      await store.dispatch(Dispatch.SignOutUser);
    },
    [403]: async () => {
      await store.dispatch(Dispatch.Toast, ForbiddenErrorToast);
    },
    [404]: async () => {
      await store.dispatch(Dispatch.Toast, NotFoundToast);
    },
    [500]: async () => {
      await store.dispatch(Dispatch.Toast, ServerErrorToast);
    },
  };

  return async (fn, overrides) => {
    try {
      await fn();
    } catch (error) {
      // Network error (timeout, server unreachable, connection refused, etc.)
      if (isNetworkError(error)) {
        console.error('Failed to reach server:', error);
        await store.dispatch(Dispatch.Toast, ServerErrorToast);

        // Response error with an HTTP status code.
        // Handle the error based on status code.
      } else if (isHttpError(error) && error.status) {
        logHttpError(error);

        // 1. Override provided.
        if (overrides && overrides[error.status]) {
          await overrides[error.status](error);

          // 2. No override provded, but default handler is found.
        } else if (defaultHttpErrorHandlers[error.status]) {
          await defaultHttpErrorHandlers[error.status](error);

          // 3. Unrecognized HTTP status code - treat as server error.
        } else {
          await store.dispatch(Dispatch.Toast, ServerErrorToast);
        }

        // Unknown exception type. Could be anything.
      } else {
        console.error('Unknown error:', JSON.stringify(error, null, '  '));
        await store.dispatch(Dispatch.Toast, UnexpectedExceptionToast);
      }
    }
  };
}
