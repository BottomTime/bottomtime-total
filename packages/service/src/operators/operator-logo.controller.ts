import {
  AvatarSize,
  ImageBoundaryDTO,
  ImageBoundarySchema,
  ListAvatarURLsResponseDTO,
} from '@bottomtime/api';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Head,
  HttpCode,
  HttpStatus,
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

import { ImageBuilder } from '../image-builder';
import { StorageService } from '../storage';
import { ZodValidator } from '../zod-validator';
import { AssertOperatorOwner } from './assert-operator-owner.guard';
import { AssertOperator, CurrentOperator } from './assert-operator.guard';
import { Operator } from './operator';

const LogoSizes: ReadonlyArray<string> = ['32', '64', '128', '256'];
const SizeParams = new Set(LogoSizes.map((size) => `${size}x${size}`));

@Controller('api/operators/:operatorKey/logo')
@UseGuards(AssertOperator)
export class OperatorLogoController {
  private readonly log = new Logger(OperatorLogoController.name);

  constructor(
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  private getBaseUrl(operatorKey: string): string {
    return `/api/operators/${operatorKey}/logo/`;
  }

  private getUrls(operatorKey: string): ListAvatarURLsResponseDTO {
    const base = this.getBaseUrl(operatorKey);
    return {
      root: base,
      sizes: {
        [AvatarSize.Small]: `${base}32x32`,
        [AvatarSize.Medium]: `${base}64x64`,
        [AvatarSize.Large]: `${base}128x128`,
        [AvatarSize.XLarge]: `${base}256x256`,
      },
    };
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/logo:
   *   head:
   *     summary: Logo exists
   *     description: Check if the dive operator has an logo.
   *     operationId: operatorHasLogo
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     responses:
   *       "200":
   *         description: The operator has an logo.
   *       "404":
   *         description: The operator does not have an logo.
   *       "500":
   *         description: The request failed due to an unexpected internal server error.
   */
  @Head()
  hasLogo(@CurrentOperator() operator: Operator, @Res() res: Response) {
    res.sendStatus(operator.logo ? HttpStatus.OK : HttpStatus.NOT_FOUND);
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/logo:
   *   get:
   *     summary: Gets logo URLs
   *     description: Get the logo URLs for a dive operator.
   *     operationId: getOperatorLogo
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     responses:
   *       "200":
   *         description: The logo was retrieved successfully.
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
   *                   description: The URL to the operator's logo in 32x32 size.
   *                   example: https://bottomti.me/operator/jake23/logo/32x32
   *                 64x64:
   *                   type: string
   *                   format: uri
   *                   description: The URL to the operator's logo in 64x64 size.
   *                   example: https://bottomti.me/operator/jake23/logo/64x64
   *                 128x128:
   *                   type: string
   *                   format: uri
   *                   description: The URL to the operator's logo in 128x128 size.
   *                   example: https://bottomti.me/operator/jake23/logo/128x128
   *                 256x256:
   *                   type: string
   *                   format: uri
   *                   description: The URL to the operator's logo in 256x256 size.
   *                   example: https://bottomti.me/operator/jake23/logo/256x256
   *       "404":
   *         description: The request failed because the target operator does not exist or does not have an logo.
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
  async getLogoUrls(
    @CurrentOperator() operator: Operator,
  ): Promise<ListAvatarURLsResponseDTO> {
    if (!operator.logo) {
      throw new NotFoundException('Dive operator does not have a logo saved.');
    }

    return this.getUrls(operator.slug);
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/logo/{size}:
   *   get:
   *     summary: Get logo
   *     description: Get the logo for an operator in the indicated size.
   *     operationId: getOperatorLogo
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *       - name: size
   *         in: path
   *         required: true
   *         description: The size of the logo to retrieve.
   *         schema:
   *           type: string
   *           enum:
   *             - 32x32
   *             - 64x64
   *             - 128x128
   *             - 256x256
   *     responses:
   *       "200":
   *         description: The logo was retrieved successfully.
   *         content:
   *           image/jpeg:
   *             schema:
   *               type: string
   *               format: binary
   *       "404":
   *         description: The request failed because the target operator does not exist or does not have an logo of the specified size.
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
  async getLogo(
    @CurrentOperator() operator: Operator,
    @Param('size') size: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!SizeParams.has(size)) {
      throw new NotFoundException(
        `Resource not found. Logo size was unrecognized: "${size}". Expected one of: ${LogoSizes.join(
          ', ',
        )}.`,
      );
    }

    if (!operator.logo) {
      throw new NotFoundException(
        'Dive operator does not have an avatar saved',
      );
    }

    const filePath = `shopLogos/${operator.id}/${size}`;
    this.log.debug(`Attempting to retrieve file "${filePath}"...`);
    const file = await this.storage.readFile(filePath);

    if (!file) {
      throw new NotFoundException('Logo is not available in specified size.');
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
   * /api/operators/{operatorKey}/logo:
   *   post:
   *     summary: Save logo
   *     description: |
   *       Set the logo for a operator. The image will be resized to a square image and saved in various sizes:
   *       * 32x32
   *       * 64x64
   *       * 128x128
   *       * 256x256
   *
   *       If the coordinate parameters (`left`, `top`, `width`, and `height`) are supplied in the form data then the image
   *       will be cropped to the region specified. For best results, the region should be a square (`width` and `height` should be equal).
   *       If the region is not a square some stretching/distortion may occur in the final image.
   *     operationId: saveLogo
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             oneOf:
   *               - type: object
   *                 required:
   *                   - logo
   *                   - left
   *                   - top
   *                   - width
   *                   - height
   *                 properties:
   *                   logo:
   *                     type: string
   *                     format: binary
   *                     description: The image to store as the operator's logo.
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
   *                   - logo
   *                 properties:
   *                   logo:
   *                     type: string
   *                     format: binary
   *                     description: |
   *                       The image to store as the operator's logo. The image will be resized to a square image and saved in various sizes:
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
   *         description: The logo was saved successfully.
   *       "400":
   *         description: |
   *           The request could not be completed because there was an issue with the request body. Please check the the response for more information.
   *           Likely causes:
   *             * The image was missing or was not a valid image format.
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
   *         description: The request failed because the target operator does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "413":
   *         description: The request failed because the uploaded image was too large. The maximum size is 10Mb.
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
  @UseGuards(AssertOperatorOwner)
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: {
        files: 1,
        fileSize: 10 * 1024 * 1024, // 10Mb
      },
    }),
  )
  async uploadLogo(
    @CurrentOperator() operator: Operator,
    @Body(new ZodValidator(ImageBoundarySchema.optional()))
    params: ImageBoundaryDTO,
    @UploadedFile()
    logo: Express.Multer.File | undefined,
  ): Promise<ListAvatarURLsResponseDTO> {
    if (!logo) {
      throw new BadRequestException('No logo image was provided.');
    }

    if (!logo.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `The uploaded file has an invalid MIME type: "${logo.mimetype}". Expected "image/*".`,
      );
    }

    this.log.debug('Processing uploaded logo image...');
    const imageBuilder256 = new ImageBuilder(logo.buffer);

    if ('left' in params) {
      this.log.debug('Cropping uploaded image to specified region...');
      await imageBuilder256.crop(
        params.left,
        params.top,
        params.width,
        params.height,
      );
    }

    const [imageBuilder128, imageBuilder64, imageBuilder32] = await Promise.all(
      [
        imageBuilder256.clone(),
        imageBuilder256.clone(),
        imageBuilder256.clone(),
      ],
    );

    this.log.debug(
      'Resizing uploaded logo to 256x256, 128x128, 64x64, and 32x32...',
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
        `shopLogos/${operator.id}/256x256`,
        await imageBuilder256.toBuffer(),
        logo.mimetype,
      ),
      this.storage.writeFile(
        `shopLogos/${operator.id}/128x128`,
        await imageBuilder128.toBuffer(),
        logo.mimetype,
      ),
      this.storage.writeFile(
        `shopLogos/${operator.id}/64x64`,
        await imageBuilder64.toBuffer(),
        logo.mimetype,
      ),
      this.storage.writeFile(
        `shopLogos/${operator.id}/32x32`,
        await imageBuilder32.toBuffer(),
        logo.mimetype,
      ),
    ]);

    this.log.debug('Updating user profile with new avatar URL...');
    await operator.setLogoUrl(this.getBaseUrl(operator.slug));

    return this.getUrls(operator.slug);
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/logo:
   *   delete:
   *     summary: Delete logo
   *     description: Delete the logo for a operator.
   *     operationId: deleteLogo
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     responses:
   *       "204":
   *         description: The logo was deleted successfully (or the operator did not have an logo to delete).
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
   *         description: The request failed because the target operator does not exist.
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AssertOperatorOwner)
  async deleteLogo(@CurrentOperator() operator: Operator): Promise<void> {
    this.log.debug('Deleting dive operator logo from storage...');
    await Promise.all(
      LogoSizes.map((size) =>
        this.storage.deleteFile(`shopLogos/${operator.slug}/${size}x${size}`),
      ),
    );

    this.log.debug('Clearing operator logo URL...');
    await operator.setLogoUrl(null);
  }
}
