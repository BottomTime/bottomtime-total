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
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     LogEntryImportId:
 *       name: importId
 *       in: path
 *       description: The ID of the log entry import being requested.
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     BuddyUsername:
 *       name: buddyUsername
 *       in: path
 *       required: true
 *       description: The dive buddy's unique username.
 *       schema:
 *         type: string
 *         pattern: ^[a-z0-9]+([_.-][a-z0-9]+)*$
 *         example: jane.diver
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
 *     LogEntrySample:
 *       type: object
 *       required:
 *         - offset
 *         - depth
 *       properties:
 *         offset:
 *           type: number
 *           format: int32
 *           name: Time offset
 *           description: |
 *             The time offset from the beginning of the dive at which the sample was taken.
 *             Specified in milliseconds.
 *           example: 144000
 *           minimum: 0
 *         depth:
 *           type: number
 *           format: float
 *           name: Depth
 *           description: The depth recorded at the time of the sample. Specified in the same units as the depth values in the log entry.
 *           example: 30.5
 *           minimum: 0
 *         temperature:
 *           type: number
 *           format: float
 *           name: Temperature
 *           description: The temperature recorded at the time of the sample. Specified in the same units as the temperature values in the log entry.
 *           example: 26.3
 *         gps:
 *           type: object
 *           required:
 *             - lat
 *             - lng
 *           properties:
 *             lat:
 *               type: number
 *               format: float
 *               name: Latitude
 *               description: The latitude at which the sample was taken.
 *               example: 20.480903
 *               minimum: -90
 *               maximum: 90
 *             lng:
 *               type: number
 *               format: float
 *               name: Longitude
 *               description: The longitude at which the sample was taken.
 *               example: -86.993041
 *               minimum: -180
 *               maximum: 180
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
 *               type: integer
 *               format: int64
 *               name: Entry Date/Time
 *               description: Time and date at which the dive began (specified in milliseconds since Unix Epoch time).
 *               example: 1625419200000
 *             timezone:
 *               type: string
 *               name: Timezone
 *               description: The timezone in which the dive took place.
 *               example: America/New_York
 *             duration:
 *               type: number
 *               format: float
 *               name: Duration
 *               description: The total duration of the dive. (I.e. The total time underwater.) Specified in seconds.
 *               example: 3442.89
 *               exclusiveMinimum: 0
 *             surfaceInterval:
 *               type: number
 *               format: float
 *               name: Surface Interval
 *               description: The length of the surface interval since the previous dive (assuming there was one). Specified in seconds.
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
 *             operator:
 *               type: string
 *               format: uuid
 *               title: Dive Shop
 *               description: A reference to the dive operator (if any) that facilitated the dive. (Must be a valid ID.)
 *               example: 2c33c9a8-66d8-4352-8d1e-6c12d9aa76ac
 *             samples:
 *               type: array
 *               description: An array of data samples taken during the dive by a dive computer.
 *               title: Dive Computer Data Samples
 *               items:
 *                 $ref: "#/components/schemas/LogEntrySample"
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
 *           $ref: "#/components/schemas/SuccinctDiveSite"
 *         operator:
 *           $ref: "#/components/schemas/SuccinctDiveOperator"
 *         createdAt:
 *           type: integer
 *           format: int64
 *           name: Created At
 *           description: The date and time at which the log entry was first created. (Specified in milliseconds since Unix Epoch time.)
 *           example: 1625419200000
 *         updatedAt:
 *           type: integer
 *           format: int64
 *           name: Updated At
 *           description: The date and time at which the log entry was last updated. (Specified in milliseconds since Unix Epoch time.)
 *           example: 1625419200000
 *     LogEntry:
 *       allOf:
 *         - $ref: "#/components/schemas/LogEntryGeneratedProps"
 *         - $ref: "#/components/schemas/LogEntryBaseFull"
 *     SuccinctLogEntry:
 *       allOf:
 *         - $ref: "#/components/schemas/LogEntryGeneratedProps"
 *         - $ref: "#/components/schemas/LogEntryBase"
 *     LogEntryImport:
 *       type: object
 *       required:
 *         - id
 *         - date
 *         - failed
 *         - owner
 *         - finalized
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique ID of the log entry import.
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         date:
 *           type: integer
 *           format: int64
 *           description: The date and time at which the import was initiated (or finalized if it has been finalized). (Specified in milliseconds since Unix Epoch time.)
 *           example: 1625419200000
 *         error:
 *           type: string
 *           description: |
 *             A more detailed error message on why an import failed. This value may only be accessible to admins for debugging
 *             purposes.
 *           example: Error writing to database.
 *         failed:
 *           type: boolean
 *           description: Indicates whether the import failed due to some unforeseen error.
 *           example: false
 *         owner:
 *           type: string
 *           description: The user who initiated the import.
 *           example: johndoe
 *         finalized:
 *           type: boolean
 *           description: Indicates whether the import has been finalized or whether it is still pending.
 *           example: true
 *         device:
 *           type: string
 *           description: The name of the device from which the import was made.
 *           example: Shearwater Perdix 2 Ti
 *           maxLength: 200
 *         deviceId:
 *           type: string
 *           description: The unique identifier of the device from which the import was made.
 *           example: 1234567890
 *           maxLength: 200
 *         bookmark:
 *           type: string
 *           description: |
 *             A bookmark or note associated with the import. Used to indicate where to begin the next import from
 *             the device to avoid duplication of log entries.
 *           example: "bookmark_12345"
 *           maxLength: 200
 *     CreateOrUpdateLogEntrySignatureBuddy:
 *       type: object
 *       required:
 *         - buddyType
 *       properties:
 *         buddyType:
 *           type: string
 *           title: Buddy Type
 *           description: |
 *             Type of dive buddy who is signing this log entry. Divemasters and instructors
 *             must also include their agency and certification number.
 *           example: instructor
 *           enum:
 *             - buddy
 *             - divemaster
 *             - instructor
 *     CreateOrUpdateLogEntrySignatureProfessional:
 *       allOf:
 *         - $ref: "#/components/schemas/CreateOrUpdateLogEntrySignatureBuddy"
 *         - type: object
 *           required:
 *             - agency
 *             - certificationNumber
 *           properties:
 *             agency:
 *               type: string
 *               format: uuid
 *               title: Agency
 *               description: The ID of the agency that certified the professional.
 *               example: 576148c3-550b-4ede-bfe9-f3499ad2d02c
 *             certificationNumber:
 *               type: string
 *               title: Certification Number
 *               description: The certification number of the professional.
 *               example: 123456
 *               maxLength: 100
 *     CreateOrUpdateLogEntrySignature:
 *       oneOf:
 *         - $ref: "#/components/schemas/CreateOrUpdateLogEntrySignatureBuddy"
 *         - $ref: "#/components/schemas/CreateOrUpdateLogEntrySignatureProfessional"
 *       discriminator:
 *         propertyName: buddyType
 *         mapping:
 *           buddy: "#/components/schemas/CreateOrUpdateLogEntrySignatureBuddy"
 *           divemaster: "#/components/schemas/CreateOrUpdateLogentrySignatureProfessional"
 *           instructor: "#/components/schemas/CreateOrUpdateLogentrySignatureProfessional"
 *     LogEntrySignature:
 *       type: object
 *       required:
 *         - id
 *         - signedOn
 *         - buddy
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           title: ID
 *           description: The unique ID of the signature.
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         signedOn:
 *           type: integer
 *           format: int64
 *           title: Signed On
 *           description: The date and time at which the signature was made. (Specified in milliseconds since Unix Epoch time.)
 *           example: 1625419200000
 *         buddy:
 *           $ref: "#/components/schemas/SuccinctProfile"
 *           title: Dive Buddy Profile
 *           description: The profile of the dive buddy who signed the log entry.
 *         type:
 *           type: string
 *           enum:
 *             - buddy
 *             - divemaster
 *             - instructor
 *           title: Signature Type
 *           description: The type of signature. Either `buddy`, `divemaster`, or `instructor`.
 *           example: instructor
 *         agency:
 *           $ref: "#/components/schemas/Agency"
 *           title: Agency
 *           description: The agency that certified the professional. Only present for divemaster and instructor signatures.
 *         certificationNumber:
 *           type: string
 *           title: Certification Number
 *           description: The certification number of the professional. Only present for divemaster and instructor signatures.
 *           maxLength: 200
 *           example: 123456
 */
