/**
 * @openapi
 * components:
 *   parameters:
 *     DiveSiteId:
 *       name: siteId
 *       in: path
 *       description: The ID of the dive site being requested.
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *     DiveSiteReviewId:
 *       name: reviewId
 *       in: path
 *       description: The ID of the dive site review being requested.
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *   schemas:
 *     CreateOrUpdateDiveSite:
 *       type: object
 *       required:
 *         - name
 *         - location
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the dive site.
 *           example: The Wall
 *           maxlength: 200
 *         description:
 *           type: string
 *           description: A description of the dive site.
 *           example: A wall dive with a maximum depth of 120 feet.
 *           maxlength: 2000
 *         depth:
 *           type: object
 *           description: The maximum depth of the dive site.
 *           required:
 *             - depth
 *             - unit
 *           properties:
 *             depth:
 *               type: number
 *               description: The maximum depth of the dive site.
 *               example: 120
 *               min: 0
 *             unit:
 *               type: string
 *               description: The unit of measure for the depth.
 *               enum:
 *                 - ft
 *                 - m
 *               example: ft
 *         location:
 *           type: string
 *           description: The location of the dive site.
 *           example: Key Largo, FL
 *           maxlength: 200
 *         directions:
 *           type: string
 *           description: Directions to the dive site.
 *           example: The dive site is located off the coast of Key Largo, FL.
 *           maxlength: 500
 *         gps:
 *           type: object
 *           required:
 *             - lat
 *             - lon
 *           properties:
 *             lat:
 *               type: number
 *               description: The latitude of the dive site.
 *               example: 25.0865
 *               min: -90
 *               max: 90
 *             lon:
 *               type: number
 *               description: The longitude of the dive site.
 *               example: -80.4473
 *               min: -180
 *               max: 180
 *         freeToDive:
 *           type: boolean
 *           description: Whether or not the dive site is free to dive.
 *           example: true
 *         shoreAccess:
 *           type: boolean
 *           description: Whether or not the dive site is accessible from shore.
 *           example: true
 *     DiveSite:
 *       allOf:
 *         - type: object
 *           required:
 *             - id
 *             - creator
 *             - createdOn
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: The ID of the dive site.
 *               example: 123e4567-e89b-12d3-a456-426614174000
 *             creator:
 *               $ref: "#/components/schemas/Profile"
 *             createdOn:
 *               type: string
 *               format: date-time
 *               description: The date and time the dive site was created.
 *               example: 2021-06-10T03:00:00.000Z
 *             updatedOn:
 *               type: string
 *               format: date-time
 *               description: The date and time the dive site was last updated.
 *               example: 2021-06-10T03:00:00.000Z
 *             averageRating:
 *               type: number
 *               description: The average rating of the dive site.
 *               example: 4.5
 *               min: 1.0
 *               max: 5.0
 *             averageDifficulty:
 *               type: number
 *               description: The average difficulty of the dive site.
 *               example: 3.5
 *               min: 1.0
 *               max: 5.0
 *         - $ref: "#/components/schemas/CreateOrUpdateDiveSite"
 *     CreateOrUpdateDiveSiteReview:
 *       type: object
 *       required:
 *         - title
 *         - rating
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the dive site review.
 *           example: Great Dive Site
 *           maxlength: 200
 *         rating:
 *           type: number
 *           format: float
 *           description: The rating of the dive site review.
 *           example: 4.5
 *           min: 1.0
 *           max: 5.0
 *         difficulty:
 *           type: number
 *           format: float
 *           description: The difficulty of the dive site review.
 *           example: 3.5
 *           min: 1.0
 *           max: 5.0
 *         comments:
 *           type: string
 *           description: Comments about the dive site review.
 *           example: This was a great dive site. I would definitely dive it again.
 *           maxlength: 1000
 *     DiveSiteReview:
 *       allOf:
 *         - type: object
 *           required:
 *             - id
 *             - creator
 *             - createdOn
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: The ID of the dive site review.
 *               example: 123e4567-e89b-12d3-a456-426614174000
 *             creator:
 *               type: string
 *               format: uuid
 *               description: The ID of the user who created the review.
 *               example: 123e4567-e89b-12d3-a456-426614174000
 *             createdOn:
 *               type: string
 *               format: date-time
 *               description: The date and time the dive site review was created.
 *               example: 2021-06-10T03:00:00.000Z
 *             updatedOn:
 *               type: string
 *               format: date-time
 *               description: The date and time the dive site review was last updated.
 *               example: 2021-06-10T03:00:00.000Z
 *         - $ref: "#/components/schemas/CreateOrUpdateDiveSiteReview"
 */
