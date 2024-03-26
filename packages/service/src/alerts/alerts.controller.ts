import { Controller, Inject } from '@nestjs/common';

import { AlertsService } from './alerts.service';

const AlertIdParam = ':alertId';

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
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Alert"
   *       500:
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  listAlerts() {}

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
  getAlert() {}

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
  createAlert() {}

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
  updateAlert() {}

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
  deleteAlert() {}

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
  dismissAlert() {}
}
