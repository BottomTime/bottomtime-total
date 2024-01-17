/**
 * @openapi
 * components:
 *   parameters:
 *     FriendUsername:
 *       name: friend
 *       in: path
 *       required: true
 *       description: The friend's unique username.
 *       schema:
 *         type: string
 *         pattern: ^[a-z0-9]+([_.-][a-z0-9]+)*$
 *         example: friend.mcfriendface
 *
 *   schemas:
 *     Friend:
 *       type: object
 *       required:
 *         - id
 *         - username
 *         - memberSince
 *       properties:
 *         id:
 *           title: ID
 *           type: string
 *           format: uuid
 *           description: The friend's unique ID.
 *           example: 00000000-0000-0000-0000-000000000000
 *         username:
 *           title: Username
 *           type: string
 *           pattern: ^[a-z0-9]+([_.-][a-z0-9]+)*$
 *           description: The friend's unique username.
 *           example: friend.mcfriendface
 *         memberSince:
 *           title: Member Since
 *           type: string
 *           format: date-time
 *           description: The date and time the friend joined Bottom Time.
 *           example: 2021-01-01T00:00:00.000Z
 *         avatar:
 *           title: Avatar
 *           type: string
 *           format: uri
 *           description: The URL of the friend's avatar.
 *           example: https://example.com/avatar.png
 *         name:
 *           title: Name
 *           type: string
 *           description: The friend's name.
 *           example: Friend McFriendface
 *         location:
 *           title: Location
 *           type: string
 *           description: The friend's location.
 *           example: Seattle, WA
 *
 *     FriendWithFriendsSince:
 *       allOf:
 *         - $ref: "#/components/schemas/Friend"
 *         - type: object
 *           required:
 *             - friendsSince
 *           properties:
 *             friendsSince:
 *               title: Friends Since
 *               type: string
 *               format: date-time
 *               description: The date and time the friendship was established.
 *               example: 2021-01-01T00:00:00.000Z
 *
 *     FriendRequest:
 *       type: object
 *       required:
 *         - friendId
 *         - direction
 *         - created
 *         - expires
 *         - friend
 *       properties:
 *         friendId:
 *           title: Friend ID
 *           type: string
 *           format: uuid
 *           description: The friend's unique user ID.
 *           example: 00000000-0000-0000-0000-000000000000
 *         direction:
 *           title: Direction
 *           type: string
 *           enum:
 *             - incoming
 *             - outgoing
 *           description: |
 *             The direction of the friend request.
 *             * `incoming` - The friend request was sent to the user.
 *             * `outgoing` - The friend request was sent by the user.
 *           example: incoming
 *         created:
 *           title: Created
 *           type: string
 *           format: date-time
 *           description: The date and time the friend request was created.
 *           example: 2021-01-01T00:00:00.000Z
 *         expires:
 *           title: Expires
 *           type: string
 *           format: date-time
 *           description: |
 *             The date and time the friend request expires. It will automatically be deleted if it is
 *             not acknowledged by this time.
 *           example: 2021-01-01T00:00:00.000Z
 *         friend:
 *           description: |
 *             Some relevant information on the friend's profile. Some information may be omitted depending on the
 *             friend's privacy settings (profile visibility).
 *           $ref: "#/components/schemas/Friend"
 *         accepted:
 *           title: Accepted
 *           type: boolean
 *           description: |
 *             Whether or not the friend request has been accepted or declined. This is only present if the friend request has
 *             been acknowledged.
 *             * `true` - The friend request has been accepted.
 *             * `false` - The friend request has been declined.
 *           example: false
 *         reason:
 *           title: Reason
 *           type: string
 *           description: |
 *             The reason the friend request was declined. This is only present if the friend request has been declined.
 *           example: I don't know you.
 */
