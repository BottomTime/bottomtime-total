import { Store } from 'vuex';
import { BTState, Dispatch } from '../store';

import { HTTPError, ResponseError } from 'superagent';
import { Toast, ToastType } from './toast';

export type HttpCodeHandlers = {
  [status: number]: (error: ResponseError) => void | Promise<void>;
};

export type ErrorHandlingHOF = (
  fn: () => void | Promise<void>,
  overrides?: HttpCodeHandlers,
) => Promise<void>;

function isHttpError(data: any): data is HTTPError {
  return data.text && data.method && data.path;
}

function isResponseError(data: any): data is ResponseError {
  return data.response && data.status;
}

const ServerErrorToast: Toast = {
  id: 'server-error',
  type: ToastType.Error,
  message: 'Unexpected Server Error',
  description:
    "An unexpected server error has occurred. This is a problem on our end but, rest assured, we're on it! Please check back later.",
};

export function createErrorHandler(store: Store<BTState>): ErrorHandlingHOF {
  const defaultHttpErrorHandlers: HttpCodeHandlers = {
    [400]: () => {},
    [401]: async () => {
      // 401... user is not signed in. This probably happened because the session expired. Sign the user out so
      // that they see the login form.
      await store.dispatch(Dispatch.SignOutUser);
    },
    [403]: async () => {
      const toast: Toast = {
        id: 'forbidden-error',
        type: ToastType.Error,
        message: 'Nope!',
        description: 'You are not authorized to perform the requested action.',
      };
      await store.dispatch(Dispatch.Toast, toast);
    },
    [404]: () => {},
    [409]: () => {},
    [500]: async () => {
      await store.dispatch(Dispatch.Toast, ServerErrorToast);
    },
  };

  return async (fn, overrides) => {
    try {
      await fn();
    } catch (error) {
      if (isHttpError(error)) {
        // TODO: Handle this case with a toast.
        console.error('HTTP error:', error.text);
      } else if (isResponseError(error) && error.status) {
        if (overrides && overrides[error.status]) {
          await overrides[error.status](error);
        } else if (defaultHttpErrorHandlers[error.status]) {
          await defaultHttpErrorHandlers[error.status](error);
        } else {
          // TODO: What if there is no handler?
          await store.dispatch(Dispatch.Toast, ServerErrorToast);
        }
      } else {
        console.error('Unknown error:', JSON.stringify(error, null, ' '));
        await store.dispatch(Dispatch.Toast, ServerErrorToast);
      }
    }
  };
}
