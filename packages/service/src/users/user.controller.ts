import {
  ChangeEmailParamsDTO,
  ChangeEmailParamsSchema,
  ChangePasswordParamsDTO,
  ChangePasswordParamsSchema,
  ChangeUsernameParamsDTO,
  ChangeUsernameParamsSchema,
  ProfileDTO,
  ResetPasswordWithTokenParamsDTO,
  ResetPasswordWithTokenParamsSchema,
  SuccessFailResponseDTO,
  UpdateProfileParamsDTO,
  UpdateProfileParamsSchema,
  UserSettingsDTO,
  UserSettingsSchema,
  ValidateResetPasswordTokenResponseDTO,
  VerifyEmailParamsDTO,
  VerifyEmailParamsSchema,
} from '@bottomtime/api';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Head,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { z } from 'zod';

import { Config } from '../config';
import { EventKey, EventsService } from '../events';
import { ZodValidator } from '../zod-validator';
import {
  AssertAccountOwner,
  AssertAuth,
  AssertTargetUser,
  TargetUser,
} from './guards';
import { User } from './user';
import { UsersService } from './users.service';

@Controller('api/users/:username')
export class UserController {
  constructor(
    @Inject(UsersService)
    private readonly users: UsersService,

    @Inject(EventsService)
    private readonly events: EventsService,
  ) {}

  /**
   * @openapi
   * /api/users/{username}:
   *   head:
   *     summary: Check if a Username or Email Address is Available
   *     operationId: isUsernameOrEmailAvailable
   *     description: |
   *       Checks if a username or email address is available. This is useful for checking if a user is attempting to create a new account with a username or email address that is already in use.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "200":
   *         description: |
   *           The username or email address was found and is already in use.
   *       "404":
   *         description: |
   *           The username or email cannot be found (i.e. it is available).
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   */
  @Head()
  @UseGuards(AssertTargetUser)
  async isUsernameOrEmailAvailable(): Promise<void> {
    // This method is effectively a no-op. If the guard hasn't thrown a NotFoundException, then we can just return a
    // success status code.
  }

  /**
   * @openapi
   * /api/users/{username}:
   *   get:
   *     summary: Get a User Profile
   *     operationId: getUserProfile
   *     description: |
   *       Gets a user profile by username or email address.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "200":
   *         description: |
   *           The request succeeded and the user profile will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Profile"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to view the profile.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  @UseGuards(AssertAuth, AssertTargetUser)
  async getUserProfile(@TargetUser() user: User): Promise<ProfileDTO> {
    return user.profile.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}:
   *   put:
   *     summary: Update a User's Profile
   *     operationId: updateProfile
   *     description: |
   *       Updates a user's profile information.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The user's profile.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UpdateProfile"
   *     responses:
   *       "204":
   *         description: |
   *           The profile was updated successfully.
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to update the profile.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put()
  @HttpCode(204)
  @UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
  async updateProfile(
    @TargetUser() user: User,
    @Body(new ZodValidator(UpdateProfileParamsSchema))
    profile: UpdateProfileParamsDTO,
  ): Promise<void> {
    await user.profile.update(profile);
  }

  /**
   * @openapi
   * /api/users/{username}:
   *   patch:
   *     summary: Update a User's Profile
   *     operationId: patchProfile
   *     description: |
   *       Updates a user's profile information.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The user's profile.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UpdateProfile"
   *     responses:
   *       "204":
   *         description: |
   *           The profile was updated successfully.
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to update the profile.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Patch()
  @HttpCode(204)
  @UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
  async patchProfile(
    @TargetUser() user: User,
    @Body(new ZodValidator(UpdateProfileParamsSchema))
    profile: UpdateProfileParamsDTO,
  ): Promise<void> {
    await user.profile.update(profile);
  }

  /**
   * @openapi
   * /api/users/{username}/username:
   *   post:
   *     summary: Change a User's Username
   *     operationId: changeUsername
   *     description: |
   *       Changes a user's username.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The new username.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newUsername
   *             properties:
   *               newUsername:
   *                 title: New Username
   *                 type: string
   *                 pattern: ^[a-z0-9]+([_.-][a-z0-9]+)*$
   *                 description: The user's new username. May only contain letters, numbers, dashes, periods, and underscores. Must be unique per user.
   *                 example: janedoe
   *     responses:
   *       "204":
   *         description: |
   *           The username was changed successfully.
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to change the username.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "409":
   *         description: |
   *           The request failed because the new username is already in use. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post('username')
  @HttpCode(204)
  @UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
  async changeUsername(
    @TargetUser() targetUser: User,
    @Body(new ZodValidator(ChangeUsernameParamsSchema))
    { newUsername }: ChangeUsernameParamsDTO,
  ): Promise<void> {
    await targetUser.changeUsername(newUsername);
  }

  /**
   * @openapi
   * /api/users/{username}/email:
   *   post:
   *     summary: Change a User's Email Address
   *     operationId: changeEmail
   *     description: |
   *       Changes a user's email address.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The new email address.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newEmail
   *             properties:
   *               newEmail:
   *                 title: New Email
   *                 type: string
   *                 format: email
   *                 description: The user's new email address. Must be unique per user.
   *                 example: new_email@bottomti.me
   *     responses:
   *       "204":
   *         description: |
   *           The email address was changed successfully.
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to change the email address.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "409":
   *         description: |
   *           The request failed because the new email address is already in use. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post('email')
  @HttpCode(204)
  @UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
  async changeEmail(
    @TargetUser() targetUser: User,
    @Body(new ZodValidator(ChangeEmailParamsSchema))
    { newEmail }: ChangeEmailParamsDTO,
  ): Promise<void> {
    await targetUser.changeEmail(newEmail);
  }

  /**
   * @openapi
   * /api/users/{username}/password:
   *   post:
   *     summary: Change Password
   *     operationId: changePassword
   *     description: |
   *       Changes a user's password.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The new password.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newPassword
   *             properties:
   *               oldPassword:
   *                 title: Old Password
   *                 type: string
   *                 format: password
   *                 description: The user's current password. This must be correct or the request will not succeed.
   *                 example: old_password
   *               newPassword:
   *                 title: New Password
   *                 type: string
   *                 format: password
   *                 description: The user's new password.
   *                 example: new_password
   *     responses:
   *       "200":
   *         description: |
   *           The password was changed successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Success"
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to change the password.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post('password')
  @HttpCode(200)
  @UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
  async changePassword(
    @TargetUser() user: User,
    @Body(new ZodValidator(ChangePasswordParamsSchema))
    { oldPassword, newPassword }: ChangePasswordParamsDTO,
  ): Promise<SuccessFailResponseDTO> {
    const succeeded = await user.changePassword(oldPassword, newPassword);
    return { succeeded };
  }

  /**
   * @openapi
   * /api/users/{username}/requestEmailVerification:
   *   post:
   *     summary: Request Email Verification Token
   *     operationId: requestEmailVerification
   *     description: |
   *       Requests an email verification token for the user. This token can be used to verify the user's email address.
   *       The token will be delivered to the user via email at the address in their profile.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "202":
   *         description: |
   *           The request was successfully received. The response body will indicate whether the request will be processed.
   *           * If `succeeded` is `true` then an the email verification token will be sent to the user's email address.
   *           * Otherwise, the request was rejected because the user does not have an email address set on their account
   *             or their email address is already verified.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Success"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to request an email verification token for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post('requestEmailVerification')
  @HttpCode(202)
  @UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
  async requestEmailVerification(
    @TargetUser() user: User,
  ): Promise<SuccessFailResponseDTO> {
    if (!user.email) {
      return {
        succeeded: false,
        reason: 'User does not have an email address set on their account.',
      };
    }

    if (user.emailVerified) {
      return {
        succeeded: false,
        reason: 'User email address is already verified.',
      };
    }

    const token = await user.requestEmailVerificationToken();
    const search = new URLSearchParams({ user: user.username, token });
    const verifyEmailUrl = new URL('/verifyEmail', Config.baseUrl);
    verifyEmailUrl.search = search.toString();

    this.events.emit({
      key: EventKey.UserVerifyEmailRequest,
      user,
      verificationToken: token,
      verificationUrl: verifyEmailUrl.toString(),
    });

    return { succeeded: true };
  }

  /**
   * @openapi
   * /api/users/{username}/verifyEmail:
   *   post:
   *     summary: Verify Email Address
   *     operationId: verifyEmail
   *     description: |
   *       Verifies a user's email address using an email verification token.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The email verification token.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 title: Token
   *                 type: string
   *                 description: The email verification token.
   *                 example: 1234567890abcdef
   *     responses:
   *       "200":
   *         description: |
   *           The request was received successfully and the request body will indicate whether the email address was verified.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Success"
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post('verifyEmail')
  @HttpCode(200)
  @UseGuards(AssertTargetUser)
  async verifyEmail(
    @Param('username') usernameOrEmail: string,
    @Body(new ZodValidator(VerifyEmailParamsSchema))
    { token }: VerifyEmailParamsDTO,
  ): Promise<SuccessFailResponseDTO> {
    const user = await this.users.getUserByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      return {
        succeeded: false,
        reason: 'The provided verification token could not be found.',
      };
    }

    const result = await user.verifyEmail(token);
    if (result) {
      return { succeeded: true };
    }

    return {
      succeeded: false,
      reason: 'The provided verification token is invalid or expired.',
    };
  }

  /**
   * @openapi
   * /api/users/{username}/requestPasswordReset:
   *   post:
   *     summary: Request Password Reset Token
   *     operationId: requestPasswordReset
   *     description: |
   *       Requests a password reset token for the user. This token can be used to reset the user's password.
   *       The token will be delivered to the user via email at the address in their profile.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "204":
   *         description: |
   *           The request was successfully received. If the user has an email address set on their account, then an email will
   *           be sent to that address with a password reset token (and a link to use it!)
   *       "400":
   *         description: |
   *           The request failed because the user does not have an email address set on their account. The service would not be
   *           able to deliver the password reset token to the user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post('requestPasswordReset')
  @HttpCode(204)
  @UseGuards(AssertTargetUser)
  async requestPasswordReset(@TargetUser() user: User): Promise<void> {
    if (!user.email) {
      throw new BadRequestException(
        'Unable to process request. User does not have an email address set on their account.',
      );
    }

    const token = await user.requestPasswordResetToken();

    const search = new URLSearchParams({ user: user.username, token });
    const resetPasswordUrl = new URL('/resetPassword', Config.baseUrl);
    resetPasswordUrl.search = search.toString();
    this.events.emit({
      key: EventKey.UserPasswordResetRequest,
      user,
      resetToken: token,
      resetUrl: resetPasswordUrl.toString(),
    });
  }

  /**
   * @openapi
   * /api/users/{username}/resetPassword:
   *   get:
   *     summary: Validate Password Reset Token
   *     operationId: validatePasswordResetToken
   *     description: |
   *       Validates a password reset token. Returns a success/fail response indicating whether the token is valid for the
   *       indicated user.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - name: token
   *         in: query
   *         description: The password reset token.
   *         required: true
   *         schema:
   *           type: string
   *           example: 1234567890abcdef
   *     responses:
   *       "200":
   *         description: |
   *           The request suceeded and the response body will indicate whether the token is valid
   *           (`succeeded: true`) or not (`succeeded: false`).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - status
   *               properties:
   *                 status:
   *                   title: Token Status
   *                   description: |
   *                     Inidicates the status of the provided reset token.
   *                     * `valid` - The token is valid and can be used to reset the user's password.
   *                     * `invalid` - The token is invalid or the user has not yet requested a password reset token.
   *                     * `expired` - The token is correct but has expired and can no longer be used to reset the user's password.
   *                   type: string
   *                   enum:
   *                     - valid
   *                     - invalid
   *                     - expired
   *                   example: valid
   *       "400":
   *         description: |
   *           The request failed because the token parameter was missing from the query string.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get('resetPassword')
  @UseGuards(AssertTargetUser)
  validatePasswordResetToken(
    @TargetUser() user: User,
    @Query('token', new ZodValidator(z.string().min(1))) token: string,
  ): ValidateResetPasswordTokenResponseDTO {
    return { status: user.validatePasswordResetToken(token) };
  }

  /**
   * @openapi
   * /api/users/{username}/resetPassword:
   *   post:
   *     summary: Reset Password
   *     operationId: resetPassword
   *     description: |
   *       Resets a user's password using a password reset token.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The new password.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *               - newPassword
   *             properties:
   *               token:
   *                 title: Reset Token
   *                 type: string
   *                 description: The password reset token. (This is provided to the user in an email upon request.)
   *                 example: 1234567890abcdef
   *               newPassword:
   *                 title: New Password
   *                 type: string
   *                 format: password
   *                 description: The user's new password.
   *                 example: new_password
   *     responses:
   *       "200":
   *         description: |
   *           The request was received successfully and the request body will indicate whether the password was reset.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Success"
   *       "400":
   *         description: |
   *           The request failed because of one of the following reasons:
   *           * The request body was invalid or missing one or more parameters.
   *           * The new password did not meet the minimum password requirements.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post('resetPassword')
  @HttpCode(200)
  @UseGuards(AssertTargetUser)
  async resetPassword(
    @TargetUser() user: User,
    @Body(new ZodValidator(ResetPasswordWithTokenParamsSchema))
    { token, newPassword }: ResetPasswordWithTokenParamsDTO,
  ): Promise<SuccessFailResponseDTO> {
    const succeeded = await user.resetPassword(token, newPassword);
    return { succeeded };
  }

  /**
   * @openapi
   * /api/users/{username}/settings:
   *   put:
   *     summary: Update a User's Settings
   *     operationId: updateSettings
   *     description: |
   *       Updates a user's settings.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The user's settings.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UserSettings"
   *     responses:
   *       "204":
   *         description: |
   *           The settings were updated successfully.
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to update the settings.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put('settings')
  @HttpCode(204)
  @UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
  async updateSettings(
    @TargetUser() user: User,
    @Body(new ZodValidator(UserSettingsSchema)) settings: UserSettingsDTO,
  ): Promise<void> {
    await user.changeSettings(settings);
  }

  /**
   * @openapi
   * /api/users/{username}/settings:
   *   patch:
   *     summary: Update a User's Settings
   *     operationId: patchSettings
   *     description: |
   *       Updates a user's settings.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The user's settings.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UserSettings"
   *     responses:
   *       "204":
   *         description: |
   *           The settings were updated successfully.
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to update the settings.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Patch('settings')
  @HttpCode(204)
  @UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
  async patchSettings(
    @TargetUser() user: User,
    @Body(new ZodValidator(UserSettingsSchema.partial()))
    settings: Partial<UserSettingsDTO>,
  ): Promise<void> {
    await user.changeSettings(settings);
  }
}
