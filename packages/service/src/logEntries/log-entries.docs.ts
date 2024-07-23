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
 *         - timing
 *       properties:
 *         logNumber:
 *           type: number
 *           format: int32
 *           description: |
 *             The log number of the dive. This can be whatever the diver feels like using but, ideally, should be sequential.
 *           example: 77
 *           minimum: 1
 *         timing:
 *           type: object
 *           required:
 *             - entryTime
 *             - duration
 *           properties:
 *             bottomTime:
 *               type: number
 *               format: float
 *               name: Bottom time
 *               description: The bottom time (time excluding final ascent and safety stop) of the dive. Specified in seconds.
 *               example: 2783.1
 *               exclusiveMinimum: 0
 *             entryTime:
 *               type: object
 *               required:
 *                 - date
 *                 - timezone
 *               properties:
 *                 date:
 *                   type: string
 *                   pattern: ^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?$
 *                   name: Entry Date/Time
 *                   description: Time and date at which the dive began (specified in local time).
 *                   example: 2021-07-04T12:00:00.345
 *                 timezone:
 *                   type: string
 *                   name: Timezone
 *                   description: The timezone in which the dive took place.
 *                   example: America/New_York
 *             duration:
 *               type: number
 *               format: float
 *               name: Duration
 *               description: The total duration of the dive. (I.e. The total time underwater.) Specified in seconds.
 *               example: 3442.89
 *               exclusiveMinimum: 0
 *         depths:
 *           type: object
 *           properties:
 *             averageDepth:
 *               type: number
 *               format: float
 *               name: Average Depth
 *               description: The average depth of the dive.
 *               example: 45.2
 *               exclusiveMinimum: 0
 *             maxDepth:
 *               type: number
 *               format: float
 *               name: Maximum Depth
 *               description: The maximum depth reached during the dive.
 *               example: 120.3
 *               exclusiveMinimum: 0
 *             depthUnit:
 *               type: string
 *               name: Depth Unit
 *               description: The unit of measure for the depth values.
 *               enum:
 *                 - ft
 *                 - m
 *               example: ft
 *         tags:
 *           type: array
 *           name: Tags
 *           description: A list of searchable tags to label the dive with.
 *           items:
 *             type: string
 *             maxLength: 100
 *           example:
 *             - night dive
 *             - reef
 *     LogEntryBaseFull:
 *       allOf:
 *         - $ref: "#/components/schemas/LogEntryBase"
 *         - type: object
 *           properties:
 *             equipment:
 *               type: object
 *               properties:
 *                 weight:
 *                   type: number
 *                   format: float
 *                   name: Weight
 *                   description: Amount of weight worn by the diver for the dive.
 *                   example: 4.5
 *                   minimum: 0
 *                 weightUnit:
 *                   type: string
 *                   name: Weight Unit
 *                   description: The unit of measure for the weight worn by the diver.
 *                   enum:
 *                     - kg
 *                     - lbs
 *                   example: kg
 *                 weightCorrectness:
 *                   type: string
 *                   name: Weight Correctness
 *                   description: Indicates how accurate the amount of weight worn was for the dive.
 *                   enum:
 *                     - good
 *                     - over
 *                     - under
 *                   example: good
 *                 trimCorrectness:
 *                   type: string
 *                   name: Trim Correctness
 *                   description: Indicates whether the diver was in good trim for the dive or was diving head- or knees-down.
 *                   enum:
 *                     - good
 *                     - headDown
 *                     - kneesDown
 *                   example: good
 *                 exposureSuit:
 *                   type: string
 *                   name: Exposure Suit
 *                   description: Indicates the type of exposure suit the diver wore for the dive.
 *                   enum:
 *                     - 3mm
 *                     - 5mm
 *                     - 7mm
 *                     - 9mm
 *                     - drysuit
 *                     - none
 *                     - other
 *                     - rashguard
 *                     - shorty
 *                   example: 5mm
 *                 hood:
 *                   type: boolean
 *                   name: Hood
 *                   description: Indicates if the diver was wearing a hood for the dive.
 *                   example: true
 *                 gloves:
 *                   type: boolean
 *                   name: Gloves
 *                   description: Indicates if the diver was wearing gloves for the dive.
 *                   example: true
 *                 boots:
 *                   type: boolean
 *                   name: Boots
 *                   description: Indicates if the diver was wearing boots for the dive.
 *                   example: true
 *                 camera:
 *                   type: boolean
 *                   name: Camera
 *                   description: Indicates if the diver was carrying a camera during the dive.
 *                   example: true
 *                 torch:
 *                   type: boolean
 *                   name: Torch/Flashlight
 *                   description: Indicates if the diver was carrying a torch/flashlight during the dive.
 *                   example: true
 *                 scooter:
 *                   type: boolean
 *                   name: Scooter/DPV
 *                   description: Indicates if the diver was using a sooter/DPV during the dive.
 *                   example: true
 *             conditions:
 *               type: object
 *               properties:
 *                 airTemperature:
 *                   type: number
 *                   format: float
 *                   name: Air Temperature
 *                   description: Temperature of the air above the surface.
 *                   example: 26.3
 *                 surfaceTemperature:
 *                   type: number
 *                   format: float
 *                   name: Surface Temperature
 *                   description: Temperature of the water at the surface (above the thermocline).
 *                   example: 15.8
 *                 bottomTemperature:
 *                   type: number
 *                   format: float
 *                   name: Bottom Temperature
 *                   description: Temperature of the water at the bottom/max depth (below the thermocline).
 *                   example: 12.5
 *                 temperatureUnit:
 *                   type: string
 *                   name: Temperature Unit
 *                   description: The unit of measure for the temperature values.
 *                   enum:
 *                     - C
 *                     - F
 *                   example: C
 *                 chop:
 *                   type: number
 *                   format: float
 *                   name: Chop
 *                   description: |
 *                     The chop (wave height) at the surface. A rating between 1 and 5 where 1 is perfectly calm and 5 is extremely rough.
 *                   example: 2.5
 *                   minimum: 1
 *                   maximum: 5
 *                 current:
 *                   type: number
 *                   format: float
 *                   name: Current
 *                   description: |
 *                     The strength of the current. A rating between 1 and 5 where 1 is no current and 5 is extremely strong.
 *                   example: 3.5
 *                   minimum: 1
 *                   maximum: 5
 *                 weather:
 *                   type: string
 *                   name: Weather
 *                   description: A brief description of the weather conditions during the dive.
 *                   example: Partly cloudy with some light rain. Low wind.
 *                   maxLength: 100
 *                 visibility:
 *                   type: number
 *                   format: float
 *                   name: Visibility
 *                   description: |
 *                     The visibility of the water during the dive. A rating from 1 to 5 where 1 is barely any visibility
 *                     and 5 is crystal clear water with vis for days!
 *                   example: 4.5
 *                   minimum: 1
 *                   maximum: 5
 *             air:
 *               type: array
 *               description: |
 *                 An array listing tanks used during the dive as well as their contents and starting/ending pressures.
 *               items:
 *                 $ref: "#/components/schemas/LogEntryAir"
 *             notes:
 *               type: string
 *               name: Notes/Comments
 *               description: Any notes about the dive.
 *               example: Saw a sea turtle at 30 feet.
 *               maxLength: 2000
 *     CreateOrUpdateLogEntry:
 *       allOf:
 *         - $ref: "#/components/schemas/LogEntryBaseFull"
 *         - type: object
 *           properties:
 *             site:
 *               type: string
 *               format: uuid
 *               title: Location
 *               description: A reference to the dive site where the dive took place. (Must be a valid ID.)
 *               example: 2c33c9a8-66d8-4352-8d1e-6c12d9aa76ac
 *     LogEntryGeneratedProps:
 *       type: object
 *       required:
 *         - id
 *         - creator
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique ID of the log entry.
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         creator:
 *           description: The diver to whom the log entry belongs.
 *           $ref: "#/components/schemas/Profile"
 *         site:
 *           $ref: "#/components/schemas/DiveSite"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           name: Created At
 *           description: The date and time at which the log entry was first created.
 *           example: 2021-07-04T12:00:00.345
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           name: Updated At
 *           description: The date and time at which the log entry was last updated.
 *           example: 2021-07-04T12:00:00
 *     LogEntry:
 *       allOf:
 *         - $ref: "#/components/schemas/LogEntryGeneratedProps"
 *         - $ref: "#/components/schemas/LogEntryBaseFull"
 *     SuccinctLogEntry:
 *       allOf:
 *         - $ref: "#/components/schemas/LogEntryGeneratedProps"
 *         - $ref: "#/components/schemas/LogEntryBase"
 */
