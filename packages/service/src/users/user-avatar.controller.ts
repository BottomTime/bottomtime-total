import {
  SetProfileAvatarParamsDTO,
  SetProfileAvatarParamsSchema,
} from '@bottomtime/api';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Head,
  Inject,
  NotFoundException,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Response } from 'express';
import 'multer';
import { URL, resolve } from 'url';

import { AssertAuth } from '../auth';
import { Config } from '../config';
import { ImageBuilder } from '../image-builder';
import { StorageService } from '../storage';
import { ZodValidator } from '../zod-validator';
import { AssertAccountOwner } from './assert-account-owner.guard';
import { AssertTargetUser, TargetUser } from './assert-target-user.guard';
import { User } from './user';

@Controller('/api/users/:username/avatar')
@UseGuards(AssertTargetUser)
export class UserAvatarController {
  constructor(
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  private getBaseUrl(username: string): string {
    return new URL(`/api/users/${username}/avatar/`, Config.baseUrl).toString();
  }

  private getUrls(username: string) {
    const base = this.getBaseUrl(username);
    return {
      '32x32': resolve(base, './32x32'),
      '64x64': resolve(base, './64x64'),
      '128x128': resolve(base, './128x128'),
      '256x256': resolve(base, './256x256'),
    };
  }

  /**
   * @openapi
   * /api/users/{username}/avatar:
   *   head:
   *     summary: Avatar exists
   *     description: Check if the user has an avatar.
   *     operationId: hasAvatar
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "200":
   *         description: The user has an avatar.
   *       "404":
   *         description: The user does not have an avatar.
   *       "500":
   *         description: The request failed due to an unexpected internal server error.
   */
  @Head()
  async hasAvatar(
    @TargetUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    res.sendStatus(user.profile.avatar ? 200 : 404);
  }

  /**
   * @openapi
   * /api/users/{username}/avatar:
   *   get:
   *     summary: Gets avatar URLs
   *     description: Get the avatar URLs for a user.
   *     operationId: getAvatar
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "200":
   *         description: The avatar was retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - 32x32
   *                 - 64x64
   *                 - 128x128
   *                 - 256x256
   *               properties:
   *                 32x32:
   *                   type: string
   *                   format: uri
   *                   description: The URL to the user's avatar in 32x32 size.
   *                   example: https://bottomti.me/users/jake23/avatar/32x32
   *                 64x64:
   *                   type: string
   *                   format: uri
   *                   description: The URL to the user's avatar in 64x64 size.
   *                   example: https://bottomti.me/users/jake23/avatar/64x64
   *                 128x128:
   *                   type: string
   *                   format: uri
   *                   description: The URL to the user's avatar in 128x128 size.
   *                   example: https://bottomti.me/users/jake23/avatar/128x128
   *                 256x256:
   *                   type: string
   *                   format: uri
   *                   description: The URL to the user's avatar in 256x256 size.
   *                   example: https://bottomti.me/users/jake23/avatar/256x256
   *       "404":
   *         description: The request failed because the target user does not exist or does not have an avatar.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async getAvatarUrls(
    @TargetUser() user: User,
  ): Promise<Record<string, string>> {
    if (!user.profile.avatar) {
      throw new NotFoundException('User does not have an avatar saved.');
    }

    return this.getUrls(user.username);
  }

  /**
   * @openapi
   * /api/users/{username}/avatar/{size}:
   *   get:
   *     summary: Get avatar
   *     description: Get the avatar for a user in the indicated size.
   *     operationId: getAvatar
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - name: size
   *         in: path
   *         required: true
   *         description: The size of the avatar to retrieve.
   *         schema:
   *           type: string
   *           enum:
   *             - 32x32
   *             - 64x64
   *             - 128x128
   *             - 256x256
   *     responses:
   *       "200":
   *         description: The avatar was retrieved successfully.
   *         content:
   *           image/jpeg:
   *             schema:
   *               type: string
   *               format: binary
   *       "404":
   *         description: The request failed because the target user does not exist or does not have an avatar of the specified size.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(':size')
  async getAvatar(): Promise<void> {}

  /**
   * @openapi
   * /api/users/{username}/avatar:
   *   post:
   *     summary: Save avatar
   *     description: |
   *       Set the avatar for a user. The image will be resized to a square image and saved in various sizes:
   *       * 32x32
   *       * 64x64
   *       * 128x128
   *       * 256x256
   *
   *       If the coordinate parameters (`left`, `top`, `width`, and `height`) are supplied in the form data then the image
   *       will be cropped to the region specified. For best results, the region should be a square (`width` and `height` should be equal).
   *       If the region is not a square some stretching/distortion may occur in the final image.
   *     operationId: saveAvatar
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             oneOf:
   *               - type: object
   *                 required:
   *                   - avatar
   *                   - left
   *                   - top
   *                   - width
   *                   - height
   *                 properties:
   *                   avatar:
   *                     type: string
   *                     format: binary
   *                     description: The image to store as the user's avatar.
   *                   left:
   *                     type: integer
   *                     minimum: 0
   *                     description: The left coordinate of the region to crop. (Specified in pixels from the left edge of the image.)
   *                   top:
   *                     type: integer
   *                     minimum: 0
   *                     description: The top coordinate of the region to crop. (Specified in pixels from the top edge of the image.)
   *                   width:
   *                     type: integer
   *                     minimum: 1
   *                     example: 512
   *                     description: The width of the region to crop. (Specified in pixels.)
   *                   height:
   *                     type: integer
   *                     minimum: 1
   *                     example: 512
   *                     description: The height of the region to crop. (Specified in pixels.)
   *               - type: object
   *                 required:
   *                   - avatar
   *                 properties:
   *                   avatar:
   *                     type: string
   *                     format: binary
   *                     description: |
   *                       The image to store as the user's avatar. The image will be resized to a square image and saved in various sizes:
   *                         * 32x32
   *                         * 64x64
   *                         * 128x128
   *                         * 256x256
   *
   *                       If the coordinate parameters (`left`, `top`, `width`, and `height`) are supplied in the form data then the image
   *                       will be cropped to the region specified. For best results, the region should be a square (`width` and `height` should be equal).
   *                       If the region is not a square some stretching/distortion may occur in the final image.
   *
   *                       The uploaded image cannot be more than 10Mb in size and must be a valid image format (e.g. PNG, JPEG, etc.).
   *     responses:
   *       "204":
   *         description: The avatar was saved successfully.
   *       "400":
   *         description: |
   *           The request could not be completed because there was an issue with the request body. Please check the the response for more information.
   *           Likely causes:
   *             * The image was missing, too large, or not a valid image format.
   *             * The coordinates of the region to crop were invalid (e.g. negative values, too large, etc.)
   *             * The bounding box formed by the coordinates would not be fully contained in the image.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the current user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not the owner of the target account and is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
  @UseGuards(AssertAuth, AssertAccountOwner)
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: {
        files: 1,
        fileSize: 10 * 1024 * 1024, // 10Mb
      },
    }),
  )
  async uploadAvatar(
    @TargetUser() user: User,
    @Body(new ZodValidator(SetProfileAvatarParamsSchema.optional()))
    params: SetProfileAvatarParamsDTO,
    @UploadedFile()
    avatar: Express.Multer.File | undefined,
  ): Promise<Record<string, string>> {
    // 1. Validate the image
    // 2. Crop/resize the image
    // 3. Save the image
    // 4. Update database
    // 5. Return URLs

    if (!avatar) {
      throw new BadRequestException('No avatar image was provided.');
    }

    if (!avatar.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `The uploaded file has an invalid MIME type: "${avatar.mimetype}". Expected "image/*".`,
      );
    }

    const imageBuilder256 = await ImageBuilder.fromBuffer(avatar.buffer);

    if ('left' in params) {
      await imageBuilder256.crop(
        params.left,
        params.top,
        params.width,
        params.height,
      );
    }

    const imageBuilder128 = imageBuilder256.clone();
    const imageBuilder64 = imageBuilder256.clone();
    const imageBuilder32 = imageBuilder256.clone();

    await Promise.all([
      imageBuilder256.resize(256),
      imageBuilder128.resize(128),
      imageBuilder64.resize(64),
      imageBuilder32.resize(32),
    ]);

    await Promise.all([
      this.storage.writeFile(
        `avatars/${user.id}/256x256`,
        await imageBuilder256.toBuffer(),
        avatar.mimetype,
      ),
      this.storage.writeFile(
        `avatars/${user.id}/128x128`,
        await imageBuilder128.toBuffer(),
        avatar.mimetype,
      ),
      this.storage.writeFile(
        `avatars/${user.id}/64x64`,
        await imageBuilder64.toBuffer(),
        avatar.mimetype,
      ),
      this.storage.writeFile(
        `avatars/${user.id}/32x32`,
        await imageBuilder32.toBuffer(),
        avatar.mimetype,
      ),
    ]);

    await user.profile.setAvatarUrl(`/api/users/${user.username}/avatar`);

    return this.getUrls(user.username);
  }

  /**
   * @openapi
   * /api/users/{username}/avatar:
   *   delete:
   *     summary: Delete avatar
   *     description: Delete the avatar for a user.
   *     operationId: deleteAvatar
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "204":
   *         description: The avatar was deleted successfully (or the user did not have an avatar to delete).
   *       "401":
   *         description: The request failed because the current user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not the owner of the target account and is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete()
  async deleteAvatar(): Promise<void> {}
}
