import { createServer as createMirageServer, Server } from 'miragejs';
import { BasicUser } from './users';

export function createServer(): Server {
  return createMirageServer({
    environment: 'test',
    routes() {
      this.get('/api/auth/me', () => ({
        anonymous: false,
        ...BasicUser,
      }));
    },
  });
}
