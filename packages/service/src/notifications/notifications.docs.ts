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
 *     NotificationType:
 *       in: path
 *       name: notificationType
 *       description: Indicates the type of notification (one of `email` or `pushNotification`).
 *       required: true
 *       schema:
 *         type: string
 *         enum:
 *           - email
 *           - pushNotification
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
 *             The icon to display with the notification. An emoji works great here.
 *           example: 👌
 *         title:
 *           type: string
 *           description: The title of the notification.
 *           example: Welcome to the platform!
 *         message:
 *           type: string
 *           description: The message content of the notification.
 *           example: We're excited to have you on board!
 *         callsToAction:
 *           type: array
 *           description: |
 *             An array of calls to action that should be displayed with the notification. Each call to action should
 *             contain a `caption` and `type` property. The `type` property must be one of `link` or `linkToNewTab`.
 *             items:
 *               type: object
 *               required:
 *                 - caption
 *                 - type
 *                 - url
 *               properties:
 *                 caption:
 *                   type: string
 *                   description: The text to display for the call to action.
 *                   example: View your profile
 *                 type:
 *                   type: string
 *                   enum:
 *                     - link
 *                     - linkToNewTab
 *                   description: |
 *                     The type of call to action. `link` will open the URL in the same tab, while `linkToNewTab` will open
 *                     the URL in a new tab.
 *                   example: link
 *                 url:
 *                   type: string
 *                   description: The URL the call to action should navigate to.
 *                   example: /profile
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
