import { JsonDataDTO, JsonSchema } from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AssertAuth, User } from '../auth';
import { ZodValidator } from '../zod-validator';
import { AssertAccountOwner } from './assert-account-owner.guard';
import { AssertTargetUser, TargetUser } from './assert-target-user.guard';
import { UserCustomDataService } from './user-custom-data.service';

@Controller('/api/users/:username/customData')
@UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
export class UserCustomDataController {
  constructor(
    @Inject(UserCustomDataService)
    private readonly service: UserCustomDataService,
  ) {}

  /**
   * @openapi
   * /api/users/{username}/customData:
   *   get:
   *     summary: Retrieve a list of custom data keys for the user
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "200":
   *         description: The request succeeded and an array of keys will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: string
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to view or modify custom data for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async listKeys(@TargetUser() user: User): Promise<string[]> {
    return await this.service.listKeys(user.id);
  }

  /**
   * @openapi
   * /api/users/{username}/customData/{key}:
   *   get:
   *     summary: Retrieve a custom data blob for the user
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - in: path
   *         name: key
   *         required: true
   *         schema:
   *           type: string
   *         description: The key of the custom data blob to retrieve
   *     responses:
   *       "200":
   *         description: The request succeeded and the custom data blob will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: true
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to view or modify custom data for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user or the indicated key could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(':key')
  async getItem(
    @TargetUser() user: User,
    @Param('key') key: string,
  ): Promise<JsonDataDTO> {
    const data = await this.service.getItem(user.id, key);
    if (data === undefined) {
      throw new NotFoundException(`Unable to find data blob with key "${key}"`);
    }

    return data;
  }

  /**
   * @openapi
   * /api/users/{username}/customData/{key}:
   *   put:
   *     summary: Set or create a custom data blob for the user
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - in: path
   *         name: key
   *         required: true
   *         schema:
   *           type: string
   *         description: The key of the custom data blob to set
   *     requestBody:
   *       required: true
   *       description: The custom data blob to set any generic JSON data will be accepted. Size is limited to 2Mb.
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             additionalProperties: true
   *           example: |
   *             {
   *               acceptedCookies: true,
   *               preferences: {
   *                 theme: 'dark',
   *                 language: 'en',
   *               },
   *             }
   *     responses:
   *       "200":
   *         description: The request succeeded and the custom data blob will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: true
   *       "201":
   *         description: The request succeeded and the custom data blob was created.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: true
   *       "400":
   *         description: |
   *           The request failed because the request body was not valid. (The JSON may be malformed or the payload may be too large.)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to view or modify custom data for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(':key')
  async setItem(
    @TargetUser() user: User,
    @Param('key') key: string,
    @Body(new ZodValidator(JsonSchema)) value: JsonDataDTO,
  ): Promise<JsonDataDTO> {
    await this.service.setItem(user.id, key, value);
    return value;
  }

  /**
   * @openapi
   * /api/users/{username}/customData/{key}:
   *   delete:
   *     summary: Remove a custom data blob for the user
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - in: path
   *         name: key
   *         required: true
   *         schema:
   *           type: string
   *         description: The key of the custom data blob to remove
   *     responses:
   *       "204":
   *         description: The request succeeded and the custom data blob was removed.
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to view or modify custom data for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user or the indicated key could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(':key')
  @HttpCode(204)
  async deleteItem(
    @TargetUser() user: User,
    @Param('key') key: string,
  ): Promise<void> {
    const succeded = await this.service.removeItem(user.id, key);
    if (!succeded) {
      throw new NotFoundException(`Unable to find data blob with key "${key}"`);
    }
  }
}
