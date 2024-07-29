/**
 * @openapi
 * components:
 *   parameters:
 *     DiveOperatorId:
 *       name: operatorId
 *       in: path
 *       description: The ID that uniquely identifies the dive operator being requested or operated upon.
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *   schemas:
 *     CreateOrUpdateDiveOperator:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           name: Name
 *           description: The name of the dive operator.
 *           example: Ocean Divers
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
 *           maxLength: 20
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
 *         - owner
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           name: ID
 *           description: The unique identifier for the dive operator.
 *         owner:
 *           $ref: "#/components/schemas/SuccinctProfile"
 *         name:
 *           type: string
 *           name: Name
 *           description: The name of the dive operator.
 *           example: Ocean Divers
 *           minLength: 1
 *           maxLength: 200
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
 *           maxLength: 20
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
 *         logo:
 *           type: string
 *           format: uri
 *           name: Logo
 *           description: The URL of the dive operator's logo.
 *           example: https://www.oceandivers.com/logo.png
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
 */
