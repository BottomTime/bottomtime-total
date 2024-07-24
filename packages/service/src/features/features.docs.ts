/**
 * @openapi
 * components:
 *   parameters:
 *     FeatureKey:
 *       name: featureKey
 *       in: path
 *       description: The unique key for the feature flag.
 *       required: true
 *       schema:
 *         type: string
 *         pattern: "^[a-z0-9]+(_[a-z0-9]+)*$"
 *         maxLength: 100
 *         example: my_key
 *   schemas:
 *     CreateOrUpdateFeature:
 *       type: object
 *       required:
 *         - name
 *         - enabled
 *       properties:
 *         name:
 *           type: string
 *           name: Name
 *           description: The human-readable name for the feature flag.
 *           maxLength: 100
 *           example: New Feature 01
 *         description:
 *           type: string
 *           name: Description
 *           description: A more detailed description of the feature flag.
 *           maxLength: 1000
 *           example: This feature flag controls the visibility of the new awesome feature.
 *         enabled:
 *           type: boolean
 *           name: Enabled
 *           description: Whether the feature flag is enabled.
 *     Feature:
 *       allOf:
 *         - type: object
 *           required:
 *             - key
 *             - createdAt
 *             - updatedAt
 *           properties:
 *             key:
 *               type: string
 *               pattern: "^[a-z0-9]+(_[a-z0-9]+)*$"
 *               maxLength: 100
 *               name: Key
 *               description: The unique key for the feature flag.
 *               example: new_feature_flag01
 *             createdAt:
 *               type: string
 *               format: date-time
 *               name: Created At
 *               description: The date and time at which the feature flag was created.
 *               example: 2021-01-01T00:00:00Z
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               name: Updated At
 *               description: The date and time at which the feature flag was last updated.
 *               example: 2021-01-01T00:00:00Z
 *         - $ref: "#/components/schemas/CreateOrUpdateFeature"
 */
