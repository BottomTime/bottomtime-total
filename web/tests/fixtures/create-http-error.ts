export function createHttpError(status: number): unknown {
  return {
    status,
    response: {
      req: {
        method: 'GET',
        url: 'https://server.com/path',
        headers: {},
      },
      header: {},
      status,
      text: JSON.stringify({
        statusCode: status,
        message: 'This is an error message.',
        httpPath: 'https://server.com/path',
        httpMethod: 'GET',
      }),
    },
  };
}
