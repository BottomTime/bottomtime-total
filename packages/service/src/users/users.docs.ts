/**
 * @openapi
 * components:
 *   parameters:
 *     Username:
 *       name: username
 *       in: path
 *       required: true
 *       description: The user's unique username (or email address).
 *       schema:
 *         type: string
 *         pattern: ^[a-z0-9]+([_.-][a-z0-9]+)*$
 *         example: johndoe
 *     UserQuerySearch:
 *       name: query
 *       in: query
 *       description: A search query string to look for. It will match on username as well as profile properties.
 *       schema:
 *         type: string
 *         maxlength: 200
 *       example: john
 *     UserQuerySortBy:
 *       name: sortBy
 *       in: query
 *       description: The property to sort the search results by.
 *       schema:
 *         type: string
 *         enum:
 *           - username
 *           - memberSince
 *       default: username
 *       example: username
 *
 *   schemas:
 *     UserCertification:
 *       type: object
 *       required:
 *         - agency
 *         - course
 *         - date
 *       properties:
 *         agency:
 *           title: Agency
 *           type: string
 *           description: The name of the agency that issued the certification.
 *           example: PADI
 *         course:
 *           title: Course
 *           type: string
 *           description: The name of the course.
 *           example: Open Water Diver
 *         date:
 *           title: Date
 *           type: string
 *           pattern: ^\d{4}(-\d{2}(-\d{2})?)?$
 *           description: The date the certification was issued.
 *           example: 2000-01-01
 *
 *     UpdateProfile:
 *       type: object
 *       properties:
 *         bio:
 *           title: Bio
 *           type: string
 *           description: A short description of about the user.
 *           maxlength: 1000
 *           example: |
 *             I'm a diver from the Pacific Northwest. I love diving in the Puget Sound.
 *             I'm a PADI Divemaster and I'm working on my instructor certification.
 *         birthdate:
 *           title: Birthdate
 *           type: string
 *           pattern: ^\d{4}(-\d{2}(-\d{2})?)?$
 *           description: The user's birthdate.
 *           example: 1980-01-01
 *         experieceLevel:
 *           title: Experience Level
 *           type: string
 *           description: The user's experience level.
 *           example: Advanced
 *           maxLength: 50
 *         location:
 *           title: Location
 *           type: string
 *           description: The user's location.
 *           example: Seattle, WA
 *           maxLength: 50
 *         logBookSharing:
 *           title: Log Book Sharing
 *           type: string
 *           enum:
 *             - private
 *             - friends
 *             - public
 *           description: The level at which the user's logbook will be shared with other users.
 *           example: public
 *         name:
 *           title: Name
 *           type: string
 *           description: The user's name.
 *           example: John Doe
 *           maxLength: 100
 *         startedDiving:
 *           title: Started Diving
 *           type: string
 *           pattern: ^\d{4}(-\d{2}(-\d{2})?)?$
 *           description: The year the user started diving.
 *           example: 2000-01-01
 *
 *     Profile:
 *       type: object
 *       allOf:
 *         - $ref: "#/components/schemas/UpdateProfile"
 *         - type: object
 *           required:
 *             - userId
 *             - username
 *             - memberSince
 *           properties:
 *             userId:
 *               title: User ID
 *               type: string
 *               format: uuid
 *               description: The user's unique ID.
 *               example: 00000000-0000-0000-0000-000000000000
 *             username:
 *               title: Username
 *               type: string
 *               pattern: ^[a-z0-9]+([_.-][a-z0-9]+)*$
 *               description: The user's username. May only contain letters, numbers, dashes, periods, and underscores. Must be unique per user.
 *               example: johndoe
 *             memberSince:
 *               title: Member Since
 *               type: string
 *               format: date-time
 *               description: The date and time the user joined Bottom Time.
 *               example: 2021-01-01T00:00:00.000Z
 *             avatar:
 *               title: Avatar
 *               description: A URL to an image that can be displayed as the diver's avatar.
 *               type: string
 *               format: url
 *               maxlength: 150
 *               example: https://example.com/avatar.png
 *
 *     UserSettings:
 *       type: object
 *       properties:
 *         depthUnit:
 *           type: string
 *           description: The user's preferred depth unit.
 *           enum:
 *             - m
 *             - ft
 *           example: m
 *         pressureUnit:
 *           type: string
 *           description: The user's preferred pressure unit.
 *           enum:
 *             - bar
 *             - psi
 *           example: bar
 *         temperatureUnit:
 *           type: string
 *           description: The user's preferred temperature unit.
 *           enum:
 *             - C
 *             - F
 *           example: C
 *         weightUnit:
 *           type: string
 *           description: The user's preferred weight unit.
 *           enum:
 *             - kg
 *             - lbs
 *           example: kg
 *         profileVisibility:
 *           title: Profile Visibility
 *           type: string
 *           description: The user's profile visibility.
 *           enum:
 *             - public
 *             - friends
 *             - private
 *           example: public
 *
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - username
 *         - emailVerified
 *         - hasPassword
 *         - isLockedOut
 *         - memberSince
 *         - profile
 *         - role
 *       properties:
 *         id:
 *           title: ID
 *           type: string
 *           format: uuid
 *           description: The user's unique ID.
 *           example: 222f0f03-3e1c-40e7-8582-05f5875b7174
 *         username:
 *           title: Username
 *           type: string
 *           pattern: ^[a-z0-9]+([_.-][a-z0-9]+)*$
 *           description: The user's username. May only contain letters, numbers, dashes, periods, and underscores. Must be unique per user.
 *           example: johndoe
 *         email:
 *           title: Email
 *           type: string
 *           format: email
 *           description: The user's email address. Must be a valid email address and must be unique per user.
 *           example: john.doe@gmail.com
 *         emailVerified:
 *           title: Email Verified
 *           type: boolean
 *           description: Indicates whether the user has verified their email address.
 *           example: true
 *         hasPassword:
 *           title: Has Password
 *           type: boolean
 *           description: Indicates whether the user has set a password on their account.
 *           example: true
 *         lastLogin:
 *           title: Last Login
 *           type: string
 *           format: date-time
 *           description: The date and time the user last logged in.
 *           example: 2021-01-01T00:00:00.000Z
 *         lastPasswordChange:
 *           title: Last Password Change
 *           type: string
 *           format: date-time
 *           description: The date and time the user last changed their password.
 *           example: 2021-01-01T00:00:00.000Z
 *         isLockedOut:
 *           title: Is Locked Out
 *           type: boolean
 *           description: Indicates whether the user's account is locked out.
 *           example: false
 *         memberSince:
 *           title: Member Since
 *           type: string
 *           format: date-time
 *           description: The date and time the user joined Bottom Time.
 *           example: 2021-01-01T00:00:00.000Z
 *         profile:
 *           $ref: "#/components/schemas/Profile"
 *         role:
 *           title: Role
 *           type: string
 *           description: The user's role.
 *           example: user
 *
 *     AnonymousStatus:
 *       type: object
 *       required:
 *         - anonymous
 *       properties:
 *         anonymous:
 *           type: boolean
 *           description: |
 *             Indicates whether the user is browsing anonymously or not.
 *             * `true` - User is not authenticated.
 *             * `false` - User is authenticated.
 *           example: false
 *
 *     CurrentUser:
 *       oneOf:
 *         - allOf:
 *             - $ref: "#/components/schemas/AnonymousStatus"
 *             - $ref: "#/components/schemas/User"
 *         - $ref: "#/components/schemas/AnonymousStatus"
 *       discriminator: anonymous
 */
