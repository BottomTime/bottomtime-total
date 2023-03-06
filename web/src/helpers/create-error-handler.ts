import { Store } from 'vuex';
import { BTState } from '../store';

import { HTTPError, ResponseError } from 'superagent';

export type HttpCodeHandlers = {
  [status: number]: (error: Error) => void | Promise<void>;
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

export function createErrorHandler(store: Store<BTState>): ErrorHandlingHOF {
  const defaultHttpErrorHandlers: HttpCodeHandlers = {
    [400]: () => {},
    [401]: () => {},
    [403]: () => {},
    [404]: () => {},
    [409]: () => {},
    [500]: () => {},
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
        }
      } else {
        // TODO: Handle this case with a toast.
        console.error('Unknown error:', JSON.stringify(error, null, ' '));
      }
    }
  };
}
