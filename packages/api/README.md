# API Client

This package is broken into two parts:

1. The API client (`src/client/`) which is used by the front-end to communicate with the backend service.
2. The type definitions (`src/types/`) which export all of the types and data structures shared between the front- and backend.

## For Consumers

The API client can be initialized like so:

```typescript
import { ApiClient } from '@bottomtime/api';

import { fetch as fetchPolyfill } from 'whatwg-fetch';

const client = new ApiClient({
  authToken: '<jwt_token>',
  baseURL: 'https://my-env.bottomti.me/',
  fetcher: fetchPolyfill,
});
```

The following options can be passed into the constructor:

- `authToken: string | undefined` - A JWT that will be used to authenticate with the APIs. This is optional. Without it your request will be interpreted
  as one from an anonymous user. If your code is meant to run in the browser then this option is not needed. The browser will adopt
  the session cookie when the user logs in and use that to authenticate the user.
- `baseURL: string | undefined` - The base URL to which requests will be made. API routes will be appended to this URL. E.g. `<baseURL>/api/users/`.
  The default is `http://localhost/`.
- `fetcher: Fetcher | undefined` - An implementation of the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
  This parameter can be used to use a mock implementation for testing or use a polyfill in older browsers/runtimes that don't support native `fetch`.
  This will default to the native Fetch implementation (`window.fetch`) if omitted.

All of the options (and, indeed the options object itself) are optional:

```typescript
const client = new ApiClient();
```

## For Developers

Here are some common operations you may want to perform.

### Building the Package

```bash
yarn build
```

### Running Jest Tests

```bash
yarn test
```
