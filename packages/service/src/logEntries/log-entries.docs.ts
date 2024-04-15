/**
 * @openapi
 * components:
 *   parameters:
 *     LogEntryId:
 *       name: entryId
 *       in: path
 *       description: The ID of the log entry being requested.
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *   schemas:
 *     CreateOrUpdateLogEntry:
 *       type: object
 *       required:
 *         - entryTime
 *         - duration
 *       properties:
 *         logNumber:
 *           type: number
 *           format: int32
 *           description: |
 *             The log number of the dive. This can be whatever the diver feels like using but, ideally, should be sequential.
 *           example: 77
 *           minimum: 1
 *         entryTime:
 *           type: object
 *           description: The date and time (including timezone) at which the dive began.
 *           required:
 *             - date
 *             - timezone
 *           properties:
 *             date:
 *               type: string
 *               format: date-time
 *               description: The date and time at which the dive began (omit the timezone).
 *               example: 2021-07-04T12:00
 *             timezone:
 *               type: string
 *               description: The timezone of the dive site. Any recognized timezone is acceptable.
 *               example: America/New_York
 *         bottomTime:
 *           type: number
 *           description: The bottom time (time excluding final ascent and safety stop) of the dive. Specified in minutes.
 *           example: 45
 *           minimum: 0
 *         duration:
 *           type: number
 *           description: The total time of the dive. Specified in minutes.
 *           example: 60.2
 *           minimum: 0
 *         maxDepth:
 *           type: object
 *           description: The maximum depth of the dive.
 *           required:
 *             - depth
 *             - unit
 *           properties:
 *             depth:
 *               type: number
 *               description: The maximum depth of the dive.
 *               example: 120
 *               minimum: 0
 *             unit:
 *               type: string
 *               description: The unit of measure for the maximum depth. (Meters or feet.)
 *               enum:
 *                 - ft
 *                 - m
 *               example: m
 *         notes:
 *           type: string
 *           description: Any notes about the dive.
 *           example: Saw a sea turtle at 30 feet.
 *           maxLength: 2000
 *     LogEntry:
 *       allOf:
 *         - type: object
 *           required:
 *             - id
 *             - creator
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: The unique ID of the log entry.
 *               example: 123e4567-e89b-12d3-a456-426614174000
 *             creator:
 *               description: The diver to whom the log entry belongs.
 *               $ref: "#/components/schemas/Profile"
 *         - $ref: "#/components/schemas/CreateOrUpdateLogEntry"
 *     SuccinctLogEntry:
 *       type: object
 *       required:
 *         - id
 *         - entryTime
 *         - creator
 *         - logNumber
 *         - maxDepth
 *         - bottomTime
 *         - duration
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique ID of the log entry.
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         entryTime:
 *           type: object
 *           description: The date and time (including timezone) at which the dive began.
 *           required:
 *             - date
 *             - timezone
 *           properties:
 *             date:
 *               type: string
 *               format: date-time
 *               description: The date and time at which the dive began (omit the timezone).
 *               example: 2021-07-04T12:00
 *             timezone:
 *               type: string
 *               description: The timezone of the dive site. Any recognized timezone is acceptable.
 *               example: America/New_York
 *         creator:
 *           description: The diver to whom the log entry belongs.
 *           $ref: "#/components/schemas/Profile"
 *         logNumber:
 *           type: number
 *           format: int32
 *           description: |
 *             The log number of the dive. This can be whatever the diver feels like using but, ideally, should be sequential.
 *           example: 77
 *           minimum: 1
 *         maxDepth:
 *           type: object
 *           description: The maximum depth of the dive.
 *           required:
 *             - depth
 *             - unit
 *           properties:
 *             depth:
 *               type: number
 *               description: The maximum depth of the dive.
 *               example: 120
 *               minimum: 0
 *             unit:
 *               type: string
 *               description: The unit of measure for the maximum depth. (Meters or feet.)
 *               enum:
 *                 - ft
 *                 - m
 *               example: m
 *         bottomTime:
 *           type: number
 *           description: The bottom time (time excluding final ascent and safety stop) of the dive. Specified in minutes.
 *           example: 45
 *           minimum: 0
 *         duration:
 *           type: number
 *           description: The total time of the dive. Specified in minutes.
 *           example: 60.2
 *           minimum: 0
 */
