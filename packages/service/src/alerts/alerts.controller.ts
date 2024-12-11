import {
  AlertDTO,
  ApiList,
  CreateOrUpdateAlertParamsDTO,
  CreateOrUpdateAlertParamsSchema,
  ListAlertsParamsDTO,
  ListAlertsParamsSchema,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UuidRegex } from 'src/common';

import { AssertAdmin, AssertAuth, CurrentUser, User } from '../users';
import { ZodValidator } from '../zod-validator';
import { Alert } from './alert';
import { AlertsService } from './alerts.service';
import { AssertTargetAlert, TargetAlert } from './assert-target-alert.guard';

const AlertIdParamName = 'alertId';
const AlertIdParam = `:${AlertIdParamName}(${UuidRegex})`;

@Controller('api/alerts')
export class AlertsController {
  constructor(@Inject(AlertsService) private readonly service: AlertsService) {}

  /**
   * @openapi
   * /api/alerts:
   *   get:
   *     summary: List all alerts
   *     description: Retrieve a list of alerts.
   *     operationId: listAlerts
   *     tags:
   *       - Alerts
   *     parameters:
   *       - in: query
   *         name: skip
   *         description: |
   *           The number of alerts to skip before returning results. Use for paginiation.
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *       - in: query
   *         name: limit
   *         description: |
   *           The maximum number of alerts to return. Use for pagination.
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 5
   *     responses:
   *       200:
   *         description: The request succeeded and the results will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - data
   *                 - totalCount
   *               properties:
   *                 data:
   *                   type: array
   *                   description: The list of alerts matching the search criteria.
   *                   items:
   *                     $ref: "#/components/schemas/Alert"
   *                 totalCount:
   *                   type: integer
   *                   description: The total number of alerts matching the search criteria.
   *                   example: 18
   *       400:
   *         description: The request was rejected because one or more of the query string parameters were invalid.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async listAlerts(
    @CurrentUser() user: User | undefined,
    @Query(new ZodValidator(ListAlertsParamsSchema))
    options: ListAlertsParamsDTO,
  ): Promise<ApiList<AlertDTO>> {
    const { data: alerts, totalCount } = await this.service.listAlerts({
      ...options,
      userId: user?.id,
    });
    return {
      data: alerts.map((alert) => alert.toJSON()),
      totalCount,
    };
  }

  /**
   * @openapi
   * /api/alerts/{alertId}:
   *   get:
   *     summary: Retrieve an alert
   *     description: Retrieve a single alert by its unique identifier.
   *     operationId: getAlert
   *     tags:
   *       - Alerts
   *     parameters:
   *       - $ref: "#/components/parameters/AlertId"
   *     responses:
   *       200:
   *         description: The request succeeded and the alert will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Alert"
   *       404:
   *         description: The alert was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(AlertIdParam)
  @UseGuards(AssertTargetAlert)
  async getAlert(@TargetAlert() alert: Alert): Promise<AlertDTO> {
    return alert.toJSON();
  }

  /**
   * @openapi
   * /api/alerts:
   *   post:
   *     summary: Create a new alert
   *     description: Create a new alert to display to users.
   *     operationId: createAlert
   *     tags:
   *       - Alerts
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateAlert"
   *     responses:
   *       201:
   *         description: The alert was created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Alert"
   *       400:
   *         description: The request was rejected because the request body failed validation.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request was rejected because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
  @UseGuards(AssertAdmin)
  async createAlert(
    @Body(new ZodValidator(CreateOrUpdateAlertParamsSchema))
    options: CreateOrUpdateAlertParamsDTO,
  ): Promise<AlertDTO> {
    const alert = await this.service.createAlert(options);
    return alert.toJSON();
  }

  /**
   * @openapi
   * /api/alerts/{alertId}:
   *   put:
   *     summary: Update an alert
   *     description: Update an existing alert.
   *     operationId: updateAlert
   *     tags:
   *       - Alerts
   *     parameters:
   *       - $ref: "#/components/parameters/AlertId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateAlert"
   *     responses:
   *       200:
   *         description: The alert was updated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Alert"
   *       400:
   *         description: The request was rejected because the request body failed validation.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request was rejected because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The alert was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(AlertIdParam)
  @UseGuards(AssertAdmin, AssertTargetAlert)
  async updateAlert(
    @TargetAlert() alert: Alert,
    @Body(new ZodValidator(CreateOrUpdateAlertParamsSchema))
    options: CreateOrUpdateAlertParamsDTO,
  ): Promise<AlertDTO> {
    alert.active = options.active ?? new Date();
    alert.expires = options.expires;
    alert.icon = options.icon;
    alert.message = options.message;
    alert.title = options.title;

    await alert.save();
    return alert.toJSON();
  }

  /**
   * @openapi
   * /api/alerts/{alertId}:
   *   delete:
   *     summary: Delete an alert
   *     description: Delete an existing alert.
   *     operationId: deleteAlert
   *     tags:
   *       - Alerts
   *     parameters:
   *       - $ref: "#/components/parameters/AlertId"
   *     responses:
   *       204:
   *         description: The alert was deleted successfully.
   *       401:
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request was rejected because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The alert was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(AlertIdParam)
  @HttpCode(204)
  @UseGuards(AssertAdmin, AssertTargetAlert)
  async deleteAlert(@TargetAlert() alert: Alert): Promise<void> {
    await alert.delete();
  }

  /**
   * @openapi
   * /api/alerts/{alertId}/dismiss:
   *   post:
   *     summary: Dismiss an alert
   *     description: Dismiss an alert so it is no longer displayed to the current user.
   *     operationId: dismissAlert
   *     tags:
   *       - Alerts
   *     parameters:
   *       - $ref: "#/components/parameters/AlertId"
   *     responses:
   *       204:
   *         description: The alert was dismissed successfully.
   *       401:
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The alert was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post(`${AlertIdParam}/dismiss`)
  @UseGuards(AssertAuth, AssertTargetAlert)
  @HttpCode(204)
  async dismissAlert(
    @CurrentUser() user: User,
    @TargetAlert() alert: Alert,
  ): Promise<void> {
    await alert.dismiss(user.id);
  }
}
