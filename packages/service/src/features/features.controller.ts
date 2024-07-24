import { Controller, Delete, Get, Inject, Post, Put } from '@nestjs/common';

import { FeaturesService } from './features.service';

const FeatureKey = ':featureKey';

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
  listFeatures() {}

  /**
   * @openapi
   * /api/features:
   *   post:
   *     tags:
   *       - Features
   *       - Admin
   *     summary: Create a new feature flag
   *     operationId: createFeature
   *     description: |
   *       Creates a new feature flag.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateFeature"
   *     responses:
   *       201:
   *         description: The new feature was created and the response body will contain the details.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Feature"
   *       400:
   *         description: The request failed because the request body was missing or invalid.
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
  @Post()
  createFeature() {}

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
  @Get(FeatureKey)
  getFeature() {}

  /**
   * @openapi
   * /api/features/{featureKey}:
   *   put:
   *     tags:
   *       - Features
   *       - Admin
   *     summary: Update a feature flag
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
   *       400:
   *         description: The request failed because the request body was missing or invalid.
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
  @Put(FeatureKey)
  updateFeature() {}

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
  @Delete(FeatureKey)
  deleteFeature() {}
}
