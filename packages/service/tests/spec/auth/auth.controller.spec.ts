import { AuthService } from '../../../src/auth';
import { AuthController } from '../../../src/auth/auth.controller';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { createTestUser } from '../../utils';
import { User } from '../../../src/users/user';
import { UnauthorizedException } from '@nestjs/common';

describe('Auth Controller', () => {
  let authService: DeepMockProxy<AuthService>;
  let controller: AuthController;

  beforeEach(() => {
    authService = mockDeep<AuthService>();
    controller = new AuthController(authService);
  });

  // describe('when authenticating a user with username and password', () => {
  //   it('will return a user if auth service returns a match', async () => {
  //     const userDocument = createTestUser();
  //     const expected = new User(userDocument);
  //     const params = {
  //       usernameOrEmail: 'bob',
  //       password: "bob's password",
  //     };
  //     authService.authenticateUser.mockResolvedValueOnce(
  //       new User(userDocument),
  //     );

  //     const actual = await controller.login(params);

  //     expect(actual).toEqual(expected.toJSON());
  //     expect(authService.authenticateUser).toBeCalledWith(
  //       params.usernameOrEmail,
  //       params.password,
  //     );
  //   });

  //   it('will throw UnauthorizedException if auth service does not return a match', async () => {
  //     authService.authenticateUser.mockResolvedValueOnce(undefined);

  //     await expect(
  //       controller.login({
  //         usernameOrEmail: 'bob',
  //         password: "bob's password",
  //       }),
  //     ).rejects.toThrowError(UnauthorizedException);
  //   });
  // });
});
