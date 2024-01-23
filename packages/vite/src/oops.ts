import { AxiosError, isAxiosError } from 'axios';

export type ErrorFunc = (e: AxiosError) => void | Promise<void>;
export type ErrorHandlers = {
  [status: number]: ErrorFunc;
  networkError?: ErrorFunc;
  default: ErrorFunc;
};

async function oops<T>(
  f: () => T | Promise<T>,
  handlers: ErrorHandlers,
): Promise<T | null> {
  try {
    return await f();
  } catch (e) {
    if (isAxiosError(e)) {
      if (e.response) {
        // Server responded with an error
        const handler = handlers[e.response.status] || handlers.default;
        await handler(e);
      } else {
        // Request was made but no response received
        const handler = handlers.networkError || handlers.default;
        await handler(e);
      }
    } else {
      // Something terrible and unexpected has happened
      await handlers.default(e);
    }
    return null;
  }
}

export function useOops() {
  return (f: () => void | Promise<void>, handlers: ErrorHandlers) => {
    // TODO: Introduce defaults handlers.
    return oops(f, handlers);
  };
}
