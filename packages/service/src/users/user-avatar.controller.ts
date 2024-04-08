import {
  SetProfileAvatarParamsDTO,
  SetProfileAvatarParamsSchema,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  Head,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Express } from 'express';
import 'multer';
import { ZodValidator } from 'src/zod-validator';

import { AssertAccountOwner } from './assert-account-owner.guard';
import { AssertTargetUser } from './assert-target-user.guard';

@Controller('/api/users/:username/avatar')
@UseGuards(AssertTargetUser, AssertAccountOwner)
export class UserAvatarController {
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
  async hasAvatar(): Promise<void> {}

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
  async getAvatarUrls(): Promise<void> {}

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
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() avatar: Express.Multer.File,
    @Body(new ZodValidator(SetProfileAvatarParamsSchema))
    params: SetProfileAvatarParamsDTO,
  ): Promise<void> {}

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
