import {
  AvatarSize,
  ListAvatarURLsResponseDTO,
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
  HttpCode,
  Inject,
  Logger,
  NotFoundException,
  Param,
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

const AvatarSizes: ReadonlyArray<string> = ['32', '64', '128', '256'];
const SizeParams = new Set(AvatarSizes.map((size) => `${size}x${size}`));

@Controller('/api/users/:username/avatar')
@UseGuards(AssertTargetUser)
export class UserAvatarController {
  private readonly log = new Logger(UserAvatarController.name);

  constructor(
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  private getBaseUrl(username: string): string {
    return new URL(`/api/users/${username}/avatar/`, Config.baseUrl).toString();
  }

  private getUrls(username: string): ListAvatarURLsResponseDTO {
    const base = this.getBaseUrl(username);
    return {
      root: base,
      sizes: {
        [AvatarSize.Small]: resolve(base, './32x32'),
        [AvatarSize.Medium]: resolve(base, './64x64'),
        [AvatarSize.Large]: resolve(base, './128x128'),
        [AvatarSize.XLarge]: resolve(base, './256x256'),
      },
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
  ): Promise<ListAvatarURLsResponseDTO> {
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
  async getAvatar(
    @TargetUser() user: User,
    @Param('size') size: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!SizeParams.has(size)) {
      throw new NotFoundException(
        `Resource not found. Avatar size was unrecognized: "${size}". Expected one of: ${AvatarSizes.join(
          ', ',
        )}.`,
      );
    }

    if (!user.profile.avatar) {
      throw new NotFoundException('User does not have an avatar saved.');
    }

    const filePath = `avatars/${user.id}/${size}`;
    this.log.debug(`Attempting to retrieve file "${filePath}"...`);
    const file = await this.storage.readFile(filePath);

    if (!file) {
      throw new NotFoundException('Avatar is not available in specified size.');
    }

    if (file.mimeType) res.type(file.mimeType);

    this.log.debug(`Streaming file "${filePath}" to client...`);
    for await (const chunk of file.content) {
      res.write(chunk);
    }

    res.end();
  }

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
  ): Promise<ListAvatarURLsResponseDTO> {
    if (!avatar) {
      throw new BadRequestException('No avatar image was provided.');
    }

    if (!avatar.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `The uploaded file has an invalid MIME type: "${avatar.mimetype}". Expected "image/*".`,
      );
    }

    this.log.debug('Processing uploaded avatar image...');
    const imageBuilder256 = await ImageBuilder.fromBuffer(avatar.buffer);

    if ('left' in params) {
      this.log.debug('Cropping uploaded image to specified region...');
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

    this.log.debug(
      'Resizing uploaded avatar to 256x256, 128x128, 64x64, and 32x32...',
    );
    await Promise.all([
      imageBuilder256.resize(256),
      imageBuilder128.resize(128),
      imageBuilder64.resize(64),
      imageBuilder32.resize(32),
    ]);

    this.log.debug('Persisting finished images to storage...');
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

    this.log.debug('Updating user profile with new avatar URL...');
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
  @HttpCode(204)
  @UseGuards(AssertAuth, AssertAccountOwner)
  async deleteAvatar(@TargetUser() user: User): Promise<void> {
    this.log.debug('Deleting user avatars from storage...');
    await Promise.all([
      AvatarSizes.map((size) =>
        this.storage.deleteFile(`avatars/${user.id}/${size}x${size}`),
      ),
    ]);

    this.log.debug('Clearing user profile avatar URL...');
    await user.profile.setAvatarUrl(null);
  }
}
