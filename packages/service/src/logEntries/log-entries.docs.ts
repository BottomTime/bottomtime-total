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
 *     LogEntryAir:
 *       type: object
 *       required:
 *         - name
 *         - material
 *         - workingPressure
 *         - volume
 *         - count
 *         - startPressure
 *         - endPressure
 *         - pressureUnit
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the tank. (E.g. AL80, HP100, etc.)
 *           example: AL80
 *           maxLength: 100
 *         material:
 *           type: string
 *           description: |
 *             The material that the tank is made of. One of `al` (aluminum) or `fe` (steel).
 *           enum:
 *             - al
 *             - fe
 *           example: al
 *         workingPressure:
 *           type: number
 *           description: |
 *             The working pressure of the tank. **NOTE:** This value is always listed in Bar.
 *           example: 207
 *           minimum: 0
 *         volume:
 *           type: number
 *           description: |
 *             The volume of the tank. **NOTE:** This value is always listed in liters.
 *           example: 11.1
 *           minimum: 0
 *         count:
 *           type: number
 *           format: int32
 *           description: The number of tanks of this type. Use this to indicate when diving doubles, etc.
 *           example: 2
 *           minimum: 1
 *         startPressure:
 *           type: number
 *           description: |
 *             The pressure in the tank at the beginning of the dive. (In the same units as `pressureUnit`.)
 *           example: 3000
 *           minimum: 0
 *         endPressure:
 *           type: number
 *           description: |
 *             The pressure remaining in the tank at the end of the dive. (In the same units as `pressureUnit`.)
 *           example: 500
 *           minimum: 0
 *         pressureUnit:
 *           type: string
 *           description: The unit of measure for the pressure in the tank before and after the dive.
 *           enum:
 *             - bar
 *             - psi
 *           example: psi
 *         o2Percent:
 *           type: number
 *           description: The percentage of oxygen in the gas blend.
 *           example: 32.2
 *           minimum: 0.0
 *           maximum: 100.0
 *         hePercent:
 *           type: number
 *           description: The percentage of helium in the gas blend.
 *           example: 41.5
 *           minimum: 0.0
 *           maximum: 100.0
 *     LogEntryBase:
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
 *         air:
 *           type: array
 *           description: |
 *             An array listing tanks used during the dive as well as their contents and starting/ending pressures.
 *           items:
 *             $ref: "#/components/schemas/LogEntryAir"
 *         notes:
 *           type: string
 *           description: Any notes about the dive.
 *           example: Saw a sea turtle at 30 feet.
 *           maxLength: 2000
 *     CreateOrUpdateLogEntry:
 *       allOf:
 *         - $ref: "#/components/schemas/LogEntryBase"
 *         - type: object
 *           properties:
 *             site:
 *               type: string
 *               format: uuid
 *               title: Location
 *               description: A reference to the dive site where the dive took place. (Must be a valid ID.)
 *               example: 2c33c9a8-66d8-4352-8d1e-6c12d9aa76ac
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
 *             site:
 *               $ref: "#/components/schemas/DiveSite"
 *         - $ref: "#/components/schemas/LogEntryBase"
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
 *           $ref: "#/components/schemas/SuccinctProfile"
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
