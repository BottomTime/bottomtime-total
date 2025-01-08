/**
 * @openapi
 * components:
 *   parameters:
 *     DiveOperatorKey:
 *       name: operatorKey
 *       in: path
 *       description: The unique slug that identifies the dive operator being requested or operated upon.
 *       required: true
 *       example: ocean-divers
 *       schema:
 *         type: string
 *         pattern: ^[a-zA-Z0-9\-$_.+!*'()]+$
 *         minLength: 1
 *         maxLength: 200
 *   schemas:
 *     CreateOrUpdateDiveOperator:
 *       type: object
 *       required:
 *         - active
 *         - name
 *         - slug
 *         - address
 *         - description
 *       properties:
 *         active:
 *           type: boolean
 *           name: Active
 *           description: |
 *             Indicates whether the dive operator is currently active and available. Inactive dive operators will not
 *             appear in search results unless the `showInactive` parameter is set to `true`.
 *
 *             This is meant to work as a "soft delete" for dive operators who have closed, either temporarily or permanently.
 *             All data will be retained for historical purposes, but the operator will not be shown in search results.
 *           example: true
 *         name:
 *           type: string
 *           name: Name
 *           description: The name of the dive operator.
 *           example: Ocean Divers
 *           minLength: 1
 *           maxLength: 200
 *         slug:
 *           type: string
 *           pattern: ^[a-zA-Z0-9\-$_.+!*'()]+$
 *           name: URL Slug
 *           description: |
 *             A short, URL-friendly version of the dive operator's name. Will be used to construct URLs for requesting
 *             the dive operator. May only contain alphanumeric characters as well as `-$_.!*`()`.
 *
 *             If omitted when creating a new dive operator, the slug will be automatically generated from the name.
 *
 *             If omitted when updating an existing dive operator, the slug will be left unchanged.
 *           example: ocean-divers
 *           minLength: 1
 *           maxLength: 200
 *         description:
 *           type: string
 *           name: Description
 *           description: A description of the dive operator.
 *           example: A full-service dive shop located right on the beach.
 *           maxLength: 2000
 *         address:
 *           type: string
 *           name: Street Address
 *           description: The full street address of the dive operator.
 *           example: 522 Caribbean Drive, Key Largo, FL 33037
 *           maxLength: 500
 *         phone:
 *           type: string
 *           name: Phone Number
 *           description: The phone number at which the dive operator can be reached.
 *           example: (305) 451-6300
 *           maxLength: 50
 *         email:
 *           type: string
 *           format: email
 *           name: Email Address
 *           description: The email address of the dive operator.
 *           example: shop@oceandivers.com
 *           maxLength: 100
 *         website:
 *           type: string
 *           format: uri
 *           name: Website
 *           description: The URL of the dive operator's website.
 *           example: https://www.oceandivers.com
 *           maxLength: 200
 *         gps:
 *           type: object
 *           required:
 *             - lat
 *             - lon
 *           properties:
 *             lat:
 *               type: number
 *               name: Latitude
 *               description: The latitude of the dive operator's location.
 *               example: 25.0865
 *               minimum: -90
 *               maximum: 90
 *             lon:
 *               type: number
 *               name: Longitude
 *               description: The longitude of the dive operator's location.
 *               example: -80.4473
 *               minimum: -180
 *               maximum: 180
 *         socials:
 *           type: object
 *           properties:
 *             facebook:
 *               type: string
 *               name: Facebook
 *               description: The Facebook username of the dive operator.
 *               example: OceanDivers
 *               maxLength: 100
 *             instagram:
 *               type: string
 *               name: Instagram
 *               description: The Instagram username of the dive operator.
 *               example: oceandivers
 *               maxLength: 100
 *             tiktok:
 *               type: string
 *               name: TikTok
 *               description: The TikTok username of the dive operator.
 *               example: "@oceandivers"
 *               maxLength: 100
 *             twitter:
 *               type: string
 *               name: Twitter / X
 *               description: The Twitter/X username of the dive operator.
 *               example: oceandivers
 *               maxLength: 100
 *             youtube:
 *               type: string
 *               name: YouTube
 *               description: The YouTube username of the dive operator.
 *               example: OceanDivers
 *               maxLength: 100
 *     DiveOperator:
 *       allOf:
 *         - type: object
 *           required:
 *             - id
 *             - createdAt
 *             - updatedAt
 *             - owner
 *             - verificationStatus
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               name: ID
 *               description: The unique identifier for the dive operator.
 *             createdAt:
 *               type: integer
 *               format: int64
 *               name: Creation Date
 *               description: The date and time at which the dive operator was first created. Specified in milliseconds since the Unix epoch.
 *             updatedAt:
 *               type: integer
 *               format: int64
 *               name: Last Updated
 *               description: The date and time at which the dive operator was last updated. Specified in milliseconds since the Unix epoch.
 *             averageRating:
 *               type: number
 *               format: float
 *               name: Average Rating
 *               description: The average rating of the dive operator, based on user reviews.
 *               example: 4.5
 *               minimum: 1.0
 *               maximum: 5.0
 *             verificationStatus:
 *               type: string
 *               enum:
 *                 - unverified
 *                 - pending
 *                 - verified
 *                 - rejected
 *               name: Verification Status
 *               description: |
 *                 The verification status of the dive operator. (The "Verified" badge is only shown for verified operators.)
 *                 Other statuses are visible only to the owner of the dive operator.
 *               example: pending
 *             verificationMessage:
 *               type: string
 *               name: Verification Message
 *               description: |
 *                 A message from an admin regarding the verification status of the dive operator. This message is only visible
 *                 to the owner of the dive operator. It may contain instructions for completing the verification process.
 *               example: Your address could not be verified. Please get into contact with us to resolve this issue.
 *             owner:
 *               $ref: "#/components/schemas/SuccinctProfile"
 *             logo:
 *               type: string
 *               format: uri
 *               name: Logo
 *               description: The URL of the dive operator's logo.
 *               example: "https://www.oceandivers.com/logo.png"
 *               maxLength: 200
 *             banner:
 *               type: string
 *               format: uri
 *               name: Banner
 *               description: The URL of the dive operator's banner image.
 *               example: "https://www.oceandivers.com/banner.png"
 *               maxLength: 200
 *         - $ref: "#/components/schemas/CreateOrUpdateDiveOperator"
 *     SuccinctDiveOperator:
 *       type: object
 *       required:
 *         - id
 *         - address
 *         - name
 *         - slug
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           name: ID
 *           description: The unique identifier for the dive operator.
 *         address:
 *           type: string
 *           name: Street Address
 *           description: The full street address of the dive operator.
 *           example: 522 Caribbean Drive, Key Largo, FL 33037
 *           maxLength: 500
 *         averageRating:
 *           type: number
 *           format: float
 *           name: Average Rating
 *           description: The average rating of the dive operator, based on user reviews.
 *           example: 4.5
 *           minimum: 1.0
 *           maximum: 5.0
 *         gps:
 *           type: object
 *           required:
 *             - lat
 *             - lon
 *           properties:
 *             lat:
 *               type: number
 *               name: Latitude
 *               description: The latitude of the dive operator's location.
 *               example: 25.0865
 *               minimum: -90
 *               maximum: 90
 *             lon:
 *               type: number
 *               name: Longitude
 *               description: The longitude of the dive operator's location.
 *               example: -80.4473
 *               minimum: -180
 *               maximum: 180
 *         logo:
 *           type: string
 *           format: uri
 *           name: Logo
 *           description: The URL of the dive operator's logo.
 *           example: "https://www.oceandivers.com/logo.png"
 *           maxLength: 200
 *         name:
 *           type: string
 *           name: Name
 *           description: The name of the dive operator.
 *           example: Ocean Divers
 *           minLength: 1
 *           maxLength: 200
 *         slug:
 *           type: string
 *           pattern: ^[a-zA-Z0-9\-$_.+!*'()]+$
 *           name: URL Slug
 *           description: |
 *             A short, URL-friendly version of the dive operator's name. Will be used to construct URLs for requesting
 *             the dive operator. May only contain alphanumeric characters as well as `-$_.!*`()`.
 *
 *             If omitted when creating a new dive operator, the slug will be automatically generated from the name.
 *
 *             If omitted when updating an existing dive operator, the slug will be left unchanged.
 *           example: ocean-divers
 *           minLength: 1
 *           maxLength: 200
 *         description:
 *           type: string
 *           name: Description
 *           description: A description of the dive operator.
 *           example: A full-service dive shop located right on the beach.
 *           maxLength: 2000
 *         phone:
 *           type: string
 *           name: Phone Number
 *           description: The phone number at which the dive operator can be reached.
 *           example: (305) 451-6300
 *           maxLength: 50
 *         website:
 *           type: string
 *           format: uri
 *           name: Website
 *           description: The URL of the dive operator's website.
 *           example: https://www.oceandivers.com
 *           maxLength: 200
 *     CreateOrUpdateDiveOperatorReview:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *         rating:
 *           type: number
 *           name: Rating
 *           description: The rating given to the dive operator.
 *           example: 4.5
 *           minimum: 1.0
 *           maximum: 5.0
 *         comments:
 *           type: string
 *           name: Comments
 *           description: Comments and feedback about the dive operator.
 *           example: Great service and friendly staff. Would definitely recommend!
 *           maxLength: 1000
 *     DiveOperatorReview:
 *       allOf:
 *         - $ref: "#/components/schemas/CreateOrUpdateDiveOperatorReview"
 *         - type: object
 *           required:
 *             - id
 *             - creator
 *             - createdAt
 *             - updatedAt
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               name: ID
 *               description: The unique identifier for the dive operator review.
 *             creator:
 *               $ref: "#/components/schemas/SuccinctProfile"
 *             createdAt:
 *               type: integer
 *               format: int64
 *               name: Creation Date
 *               description: The date and time at which the dive operator review was created. Specified in milliseconds since the Unix epoch.
 *             updatedAt:
 *               type: integer
 *               format: int64
 *               name: Last Updated
 *               description: The date and time at which the dive operator review was last updated. Specified in milliseconds since the Unix epoch.
 */
