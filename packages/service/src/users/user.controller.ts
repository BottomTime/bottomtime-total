import {
  ChangeEmailParamsDTO,
  ChangeEmailParamsSchema,
  ChangePasswordParamsDTO,
  ChangePasswordParamsSchema,
  ChangeUsernameParamsDTO,
  ChangeUsernameParamsSchema,
  ProfileDTO,
  ProfileVisibility,
  ResetPasswordWithTokenParamsDTO,
  ResetPasswordWithTokenParamsSchema,
  SuccessFailResponseDTO,
  UpdateProfileParamsDTO,
  UpdateProfileParamsSchema,
  UserRole,
  UserSettingsDTO,
  UserSettingsSchema,
  VerifyEmailParamsDTO,
  VerifyEmailParamsSchema,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Head,
  HttpCode,
  Inject,
  Patch,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AssertAuth, CurrentUser } from '../auth';
import { Config } from '../config';
import { EmailService, EmailType } from '../email';
import { ZodValidator } from '../zod-validator';
import { AssertAccountOwner } from './assert-account-owner.guard';
import { AssertTargetUser, TargetUser } from './assert-target-user.guard';
import { User } from './user';
import { UsersService } from './users.service';

@Controller('api/users/:username')
export class UserController {
  constructor(
    @Inject(UsersService)
    private readonly users: UsersService,

    @Inject(EmailService)
    private readonly emailService: EmailService,
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
  @UseGuards(AssertTargetUser)
  async getUserProfile(
    @CurrentUser() currentUser: User | undefined,
    @TargetUser() user: User,
  ): Promise<ProfileDTO> {
    // Anonymous users MAY ONLY see profiles with public visibility.
    if (!currentUser) {
      if (user.settings.profileVisibility !== ProfileVisibility.Public) {
        throw new UnauthorizedException(
          'You must be logged in to view this profile',
        );
      }
    } else if (currentUser.role === UserRole.User) {
      // Regular users MAY NOT see profiles with private visibility.
      if (user.settings.profileVisibility === ProfileVisibility.Private) {
        throw new ForbiddenException(
          'You are not authorized to view this profile.',
        );
      }

      if (user.settings.profileVisibility === ProfileVisibility.FriendsOnly) {
        const areFriends = await this.users.areFriends(currentUser.id, user.id);

        if (!areFriends) {
          throw new ForbiddenException(
            'You are not authorized to view this profile.',
          );
        }
      }
    }

    // Administrators MAY see all profiles.

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

    const title = 'Verify Your Email Address';

    const token = await user.requestEmailVerificationToken();
    const search = new URLSearchParams({ user: user.username, token });
    const verifyEmailUrl = new URL('/verifyEmail', Config.baseUrl);
    verifyEmailUrl.search = search.toString();

    const emailBody = await this.emailService.generateMessageContent({
      type: EmailType.VerifyEmail,
      title,
      user,
      verifyEmailUrl: verifyEmailUrl.toString(),
    });
    await this.emailService.sendMail({ to: [user.email!] }, title, emailBody);

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
  @Post('verifyEmail')
  @HttpCode(200)
  @UseGuards(AssertTargetUser)
  async verifyEmail(
    @TargetUser() user: User,
    @Body(new ZodValidator(VerifyEmailParamsSchema))
    { token }: VerifyEmailParamsDTO,
  ): Promise<SuccessFailResponseDTO> {
    const succeeded = await user.verifyEmail(token);
    return { succeeded };
  }

  @Post('requestPasswordReset')
  @HttpCode(204)
  @UseGuards(AssertTargetUser)
  async requestPasswordReset(@TargetUser() user: User): Promise<void> {
    const title = 'Reset Your Password';
    const token = await user.requestPasswordResetToken();

    const search = new URLSearchParams({ user: user.username, token });
    const resetPasswordUrl = new URL('/resetPassword', Config.baseUrl);
    resetPasswordUrl.search = search.toString();
    const emailBody = await this.emailService.generateMessageContent({
      type: EmailType.ResetPassword,
      title,
      user,
      resetPasswordUrl: resetPasswordUrl.toString(),
    });
    await this.emailService.sendMail({ to: [user.email!] }, title, emailBody);
  }

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
