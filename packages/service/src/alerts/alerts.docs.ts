/**
 * @openapi
 * components:
 *   paramters:
 *     AlertId:
 *       name: alertId
 *       in: path
 *       required: true
 *       description: The alert's unique identifier.
 *       schema:
 *         type: string
 *         format: uuid
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *
 *   schemas:
 *     CreateOrUpdateAlert:
 *       type: object
 *       required:
 *         - icon
 *         - title
 *         - message
 *         - active
 *       properties:
 *         icon:
 *           title: Icon
 *           type: string
 *           description: |
 *             The icon to display with the alert. Must be a valid FontAwesome v5 icon.
 *             https://fontawesome.com/v5/search
 *           example: fas fa-info
 *         title:
 *           title: Title
 *           type: string
 *           description: The title of the alert.
 *           example: New Feature!
 *         message:
 *           title: Message
 *           type: string
 *           description: The message to display with the alert. Markdown is supported.
 *           example: Check out our new feature!
 *         active:
 *           title: Active
 *           type: string
 *           format: date-time
 *           description: The date and time after which the alert should be displayed.
 *           example: 2022-01-01T00:00:00Z
 *         expires:
 *           title: Expires
 *           type: string
 *           format: date-time
 *           description: The date and time the alert should no longer be displayed.
 *           example: 2022-01-01T00:00:00Z
 *
 *     Alert:
 *       allOf:
 *         - type: object
 *           properties:
 *             id:
 *               title: ID
 *               type: string
 *               format: uuid
 *               description: The alert's unique identifier.
 *               example: 123e4567-e89b-12d3-a456-426614174000
 *         - $ref: "#/components/schemas/CreateOrUpdateAlert"
 */
