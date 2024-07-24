import {
  CreateOrUpdateFeatureDTO,
  CreateOrUpdateFeatureSchema,
  FeatureDTO,
  FeatureKeySchema,
  ToggleFeatureDTO,
  ToggleFeatureSchema,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';

import { AssertAdmin } from '../users';
import { ZodValidator } from '../zod-validator';
import { AssertFeature, TargetFeature } from './assert-feature.guard';
import { Feature } from './feature';
import { FeaturesService } from './features.service';

const FeatureKeyName = 'featureKey';
const FeatureKeyParam = `:${FeatureKeyName}`;

@Controller('api/features')
export class FeaturesController {
  constructor(
    @Inject(FeaturesService)
    private readonly service: FeaturesService,
  ) {}

  /**
   * @openapi
   * /api/features:
   *   get:
   *     tags:
   *       - Features
   *     summary: List all feature flags
   *     operationId: listFeatures
   *     description: |
   *       Returns the complete list of all feature flags.
   *     responses:
   *       200:
   *         description: The request succeeded and the response body will contain the list of feature flags.
   *         content:
   *           application/json:
   *             schema:
   *               name: List of feature flags
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Feature"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async listFeatures(): Promise<FeatureDTO[]> {
    const features = await this.service.listFeatures();
    return features.map((feature) => feature.toJSON());
  }

  /**
   * @openapi
   * /api/features/{featureKey}:
   *   get:
   *     tags:
   *       - Features
   *     summary: Get a single feature flag
   *     operationId: getFeature
   *     description: |
   *       Returns the details of a single feature flag.
   *     parameters:
   *       - $ref: "#/components/parameters/FeatureKey"
   *     responses:
   *       200:
   *         description: The request succeeded and the feature flag details will be in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Feature"
   *       404:
   *         description: The request failed because the feature flag key was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(FeatureKeyParam)
  @UseGuards(AssertFeature)
  getFeature(@TargetFeature() feature: Feature): FeatureDTO {
    return feature.toJSON();
  }

  /**
   * @openapi
   * /api/features/{featureKey}:
   *   put:
   *     tags:
   *       - Features
   *       - Admin
   *     summary: Create or update a feature flag
   *     operationId: updateFeature
   *     description: |
   *       Updates the details of a single feature flag.
   *     parameters:
   *       - $ref: "#/components/parameters/FeatureKey"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateFeature"
   *     responses:
   *       200:
   *         description: The feature flag was updated and the response body will contain the details.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Feature"
   *       201:
   *         description: The feature flag was created and the response body will contain the details.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Feature"
   *       400:
   *         description: |
   *           The request failed because the request body was missing or invalid, or the featureKey
   *           parameter was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not an administrator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(FeatureKeyParam)
  @UseGuards(AssertAdmin)
  async updateFeature(
    @Param(FeatureKeyName, new ZodValidator(FeatureKeySchema)) key: string,
    @Body(new ZodValidator(CreateOrUpdateFeatureSchema))
    options: CreateOrUpdateFeatureDTO,
    @Res() res: Response,
  ): Promise<void> {
    let feature = await this.service.getFeature(key);

    if (feature) {
      feature.name = options.name;
      feature.description = options.description;
      feature.enabled = options.enabled;
      await feature.save();

      res.status(HttpStatus.OK).json(feature.toJSON());
    } else {
      feature = await this.service.createFeature({
        key,
        ...options,
      });

      res.status(HttpStatus.CREATED).json(feature.toJSON());
    }
  }

  /**
   * @openapi
   * /api/features/{featureKey}:
   *   delete:
   *     tags:
   *       - Features
   *       - Admin
   *     summary: Delete a feature flag
   *     operationId: deleteFeature
   *     description: |
   *       Deletes a single feature flag.
   *     parameters:
   *       - $ref: "#/components/parameters/FeatureKey"
   *     responses:
   *       204:
   *         description: The feature flag was deleted successfully.
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not an administrator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the feature flag key was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(FeatureKeyParam)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AssertAdmin, AssertFeature)
  async deleteFeature(@TargetFeature() feature: Feature): Promise<void> {
    await feature.delete();
  }

  /**
   * @openapi
   * /api/features/{featureKey}/toggle:
   *   post:
   *     tags:
   *       - Features
   *       - Admin
   *     summary: Toggle a feature flag
   *     operationId: toggleFeature
   *     description: |
   *       Toggles the enabled state of a single feature flag.
   *     parameters:
   *       - $ref: "#/components/parameters/FeatureKey"
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               enabled:
   *                 type: boolean
   *                 description: |
   *                   The new enabled state for the feature flag. If not provided, the state will be toggled
   *                   from its current state. (I.e. false becomes true and true becomes false.)
   *                 example: true
   *     responses:
   *       200:
   *         description: The feature flag was toggled and the response body will contain the details.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Feature"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not an administrator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the feature flag key was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post(`${FeatureKeyParam}/toggle`)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssertAdmin, AssertFeature)
  async toggleFeature(
    @TargetFeature() feature: Feature,
    @Body(new ZodValidator(ToggleFeatureSchema)) options?: ToggleFeatureDTO,
  ): Promise<ToggleFeatureDTO> {
    const enabled = options?.enabled ?? !feature.enabled;
    feature.enabled = enabled;
    await feature.save();
    return { enabled };
  }
}
