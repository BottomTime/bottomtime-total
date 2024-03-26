/**
 * @openapi
 * components:
 *   parameters:
 *     NotificationId:
 *       name: notificationId
 *       in: path
 *       required: true
 *       description: The unique identifier of the notification.
 *       schema:
 *         type: string
 *         format: uuid
 *         example: 01234567-89ab-cdef-0123-456789abcdef
 *
 *   schemas:
 *     CreateOrUpdateNotification:
 *       type: object
 *       required:
 *         - icon
 *         - title
 *         - message
 *       properties:
 *         icon:
 *           type: string
 *           description: |
 *             The icon to display with the notification. (Must be a FontAwesome v5 icon name.)
 *             https://fontawesome.com/v5/search
 *           example: fas fa-bell
 *         title:
 *           type: string
 *           description: The title of the notification.
 *           example: Welcome to the platform!
 *         message:
 *           type: string
 *           description: The message content of the notification.
 *           example: We're excited to have you on board!
 *         active:
 *           type: string
 *           format: date-time
 *           description: |
 *             The date and time the notification should become active - notifications will not be shown to the user until this time.
 *           example: 2022-01-01T00:00:00Z
 *         expires:
 *           type: string
 *           format: date-time
 *           description: |
 *             The date and time the notification should expire and no longer be shown to the user. Expired notifications will be
 *             automatically deleted at an unspecified time.
 *           example: 2022-01-31T23:59:59Z
 *
 *     Notification:
 *       allOf:
 *         - $ref: "#/components/schemas/CreateOrUpdateNotification"
 *         - type: object
 *           required:
 *             - id
 *             - dismissed
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: The unique identifier of the notification.
 *               example: 01234567-89ab-cdef-0123-456789abcdef
 *             dismissed:
 *               type: boolean
 *               description: Whether the user has dismissed the notification.
 *               example: false
 */
