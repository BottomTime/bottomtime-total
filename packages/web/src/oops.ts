import {
  ErrorResponseDTO,
  ErrorResponseSchema,
  HttpException,
} from '@bottomtime/api';

import { ZodError } from 'zod';

import { Toast, ToastType } from './common';
import { Config } from './config';
import { useLogger } from './logger';
import { useCurrentUser, useErrors, useToasts } from './store';

const log = useLogger('oops');

export function isErrorResponse(e: unknown): e is ErrorResponseDTO {
  const validation = ErrorResponseSchema.safeParse(e);
  return validation.success;
}

export type ErrorFunc = (e: unknown) => void | Promise<void>;
export type ErrorHandlers = {
  [status: number]: ErrorFunc;
  networkError: ErrorFunc;
  default: ErrorFunc;
};

function isZodError(exception: unknown): exception is ZodError {
  return (
    exception instanceof Error &&
    exception.name === 'ZodError' &&
    'issues' in exception
  );
}

async function oops<T>(
  f: () => T | Promise<T>,
  handlers: ErrorHandlers,
): Promise<T | null> {
  try {
    return await f();
  } catch (error) {
    if (!Config.isProduction && Config.env !== 'test') {
      log.error(error as Error);
      if (isZodError(error)) {
        log.error(error.issues, (error as Error).message);
      }
    }

    if (error instanceof HttpException) {
      // Server responded with an error
      const handler = handlers[error.status] ?? handlers.default;
      await handler(error.body);
    } else {
      // Something terrible and unexpected has happened! Not a network or HTTP error!
      await handlers.default(error);
    }
    return null;
  }
}

export const UnauthorizedErrorToast: Toast = {
  id: 'unauthorized-error',
  message:
    'It seems that you are no longer logged in. Try logging in again and then retry your request.',
  type: ToastType.Warning,
} as const;

export const ForbiddenErrorToast: Toast = {
  id: 'forbidden-error',
  message:
    'It seems that you are not authorized to perform this action. Please check that you have access to the resource your are attempting to work with.',
  type: ToastType.Error,
} as const;

export const NetworkErrorToast: Toast = {
  id: 'network-error',
  message:
    'It seems that we are unable to reach the servers at the moment. Please check your internet connection and try again.',
  type: ToastType.Error,
} as const;

export const ResourceNotFoundToast: Toast = {
  id: 'resource-not-found',
  message:
    'The resource you are looking for could not be found. Please check the URL and try again.',
  type: ToastType.Error,
};

export const ServerErrorToast: Toast = {
  id: 'server-error',
  message:
    'Uh oh! A server error has occurred. This is our bad, so the issue has been logged and we are looking into it. Please try your request again later.',
  type: ToastType.Error,
} as const;

/**
 * A function for executing an asynchronous function (usually an API invocation) and either returning the result or
 * gracefully handling any errors.
 * @param f
 * The function to execute. Can return a value of type T or a Promise that resolves to type T.
 * @param handlers
 * Optional. A set of handlers for specific error codes.
 * If a handler is not provided for a specific error code, a default handler will be used.
 * @returns
 * Will return the result of calling the provided `f` function if it succeeds. Otherwise, will return `null` after
 * invoking the correct error handler.
 * @typedef T The type of the value returned or resolved to by the function.
 */
export type OopsFunction = <T>(
  f: () => T | Promise<T>,
  handlers?: Partial<ErrorHandlers>,
) => Promise<T | null>;

/**
 * The `useOops` composable function provides a wrapper function that can be used to safely invoke API requests
 * and handle any errors that are returned.
 * @returns An {@link OopsFunction} that can be used to safely invoke API requests and handle any errors that are returned.
 */
export function useOops(): OopsFunction {
  const currentUser = useCurrentUser();
  const errors = useErrors();
  const toasts = useToasts();

  return async <T>(
    f: () => T | Promise<T>,
    handlers?: Partial<ErrorHandlers>,
  ): Promise<T | null> => {
    return await oops(f, {
      // Provide a default set of handlers for common errors.
      [401]() {
        // 401 indicates the user is not logged in. The likely cause is that the session has expired.
        // Clear the current user from the user store and let the page handle the rest.
        toasts.toast(UnauthorizedErrorToast);
        currentUser.user = null;
      },
      [403]() {
        // 403 indicates the user is logged in but does not have access to the resource.
        // Show a toast.
        toasts.toast(ForbiddenErrorToast);
      },
      async [404](error): Promise<void> {
        // Resource not found. By default we'll redirect to the 404 page.
        toasts.toast(ResourceNotFoundToast);
        errors.renderError = error;
      },
      networkError(error) {
        // Network error. Show a toast.
        toasts.toast(NetworkErrorToast);
        errors.renderError = error;
      },
      default(error) {
        // By default, we'll just show a toast with a generic error message.
        toasts.toast(ServerErrorToast);
        errors.renderError = error;
      },

      // Allow the calling function to override the defaults and provide handlers for other error codes.
      ...handlers,
    });
  };
}
