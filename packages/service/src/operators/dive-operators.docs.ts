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
 *         - name
 *         - slug
 *         - address
 *         - description
 *       properties:
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
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               name: ID
 *               description: The unique identifier for the dive operator.
 *             createdAt:
 *               type: string
 *               format: date-time
 *               name: Creation Date
 *               description: The date and time at which the dive operator was first created.
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               name: Last Updated
 *               description: The date and time at which the dive operator was last updated.
 *             verified:
 *               type: boolean
 *               name: Verified
 *               description: Indicates whether the dive operator's identity has been verified by an admin.
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
 */
