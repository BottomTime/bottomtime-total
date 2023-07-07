import { createErrorHandler } from '@/helpers';
import { createHttpError } from '../../fixtures/create-http-error';
import { createStore } from '@/store';

const store = createStore();
const withErrorHandling = createErrorHandler(store);

const NetworkError = {
  errno: -61,
  code: 'ECONNREFUSED',
  syscall: 'connect',
  address: '::1',
  port: 666,
};

describe('withErrorHandling HOF', () => {
  beforeEach(() => {
    // Supress console.error for cleaner log output.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('Will toast on Network error', async () => {
    const dispatch = jest.spyOn(store, 'dispatch').mockResolvedValue(undefined);
    const fn = jest.fn().mockRejectedValue(NetworkError);

    await withErrorHandling(fn);

    expect(dispatch).toBeCalled();
    expect(dispatch.mock.lastCall).toMatchSnapshot();
  });

  it('Will toast on unknown error', async () => {
    const randomError = new Error('OMG... what is this? Could be anything!');
    const dispatch = jest.spyOn(store, 'dispatch').mockResolvedValue(undefined);
    const fn = jest.fn().mockRejectedValue(randomError);

    await withErrorHandling(fn);

    expect(dispatch).toBeCalled();
    expect(dispatch.mock.lastCall).toMatchSnapshot();
  });

  it('Will allow overrides for ResponseErrors', async () => {
    const status = 401;
    const error = createHttpError(status);
    const fn = jest.fn().mockRejectedValue(error);
    const override = jest.fn();

    await withErrorHandling(fn, { [status]: override });

    expect(override).toBeCalledWith(error);
  });

  it('Will treat unknown status codes as server errors', async () => {
    const status = 420;
    const error = createHttpError(status);
    const dispatch = jest.spyOn(store, 'dispatch').mockResolvedValue(undefined);
    const fn = jest.fn().mockRejectedValue(error);

    await withErrorHandling(fn);

    expect(dispatch).toBeCalled();
    expect(dispatch.mock.lastCall).toMatchSnapshot();
  });

  describe('Default Handlers For ResponseErrors', () => {
    it('Will toast on bad request (400)', async () => {
      const status = 400;
      const error = createHttpError(status);
      const dispatch = jest
        .spyOn(store, 'dispatch')
        .mockResolvedValue(undefined);
      const fn = jest.fn().mockRejectedValue(error);

      await withErrorHandling(fn);

      expect(dispatch).toBeCalled();
      expect(dispatch.mock.lastCall).toMatchSnapshot();
    });

    it('Will logout current user on Unauthorized (401)', async () => {
      const status = 401;
      const error = createHttpError(status);
      const dispatch = jest
        .spyOn(store, 'dispatch')
        .mockResolvedValue(undefined);
      const fn = jest.fn().mockRejectedValue(error);

      await withErrorHandling(fn);

      expect(dispatch).toBeCalled();
      expect(dispatch.mock.lastCall).toMatchSnapshot();
    });

    it('Will toast on Forbidden (403)', async () => {
      const status = 403;
      const error = createHttpError(status);
      const dispatch = jest
        .spyOn(store, 'dispatch')
        .mockResolvedValue(undefined);
      const fn = jest.fn().mockRejectedValue(error);

      await withErrorHandling(fn);

      expect(dispatch).toBeCalled();
      expect(dispatch.mock.lastCall).toMatchSnapshot();
    });

    it('Will toast on Not Found (404)', async () => {
      const status = 404;
      const error = createHttpError(status);
      const dispatch = jest
        .spyOn(store, 'dispatch')
        .mockResolvedValue(undefined);
      const fn = jest.fn().mockRejectedValue(error);

      await withErrorHandling(fn);

      expect(dispatch).toBeCalled();
      expect(dispatch.mock.lastCall).toMatchSnapshot();
    });

    it('Will toast on Server Error (500)', async () => {
      const status = 500;
      const error = createHttpError(status);
      const dispatch = jest
        .spyOn(store, 'dispatch')
        .mockResolvedValue(undefined);
      const fn = jest.fn().mockRejectedValue(error);

      await withErrorHandling(fn);

      expect(dispatch).toBeCalled();
      expect(dispatch.mock.lastCall).toMatchSnapshot();
    });
  });
});
