/**
 * @openapi
 * components:
 *   parameters:
 *     TankId:
 *       name: id
 *       in: path
 *       required: true
 *       description: The unique ID of the tank profile.
 *       schema:
 *         type: string
 *         format: uuid
 *         example: 00000000-0000-0000-0000-000000000000
 *
 *   schemas:
 *     CreateOrUpdateTank:
 *       type: object
 *       required:
 *         - name
 *         - material
 *         - workingPressure
 *         - volume
 *       properties:
 *         name:
 *           title: Name
 *           type: string
 *           description: The name of the tank.
 *           example: Steel 100
 *         material:
 *           title: Material
 *           type: string
 *           enum:
 *             - steel
 *             - aluminum
 *           description: The material the tank is made from.
 *           example: steel
 *         workingPressure:
 *           title: Working Pressure
 *           type: number
 *           description: The working pressure of the tank (in bar).
 *           example: 300
 *         volume:
 *           title: Volume
 *           type: number
 *           description: The volume of the tank (in L).
 *           example: 12
 *
 *     Tank:
 *       allOf:
 *         - $ref: "#/components/schemas/CreateOrUpdateTank"
 *         - type: object
 *           required:
 *             - id
 *             - isSystem
 *           properties:
 *             id:
 *               title: ID
 *               type: string
 *               format: uuid
 *               description: The tank's unique ID.
 *               example: 00000000-0000-0000-0000-000000000000
 *             isSystem:
 *               title: Is System
 *               type: boolean
 *               description: Whether the tank is a pre-defined system tank (as opposed to user-defined).
 *               example: false
 *
 *     ListTanksResponse:
 *       type: object
 *       required:
 *         - tanks
 *         - totalCount
 *       properties:
 *         tanks:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/Tank"
 *           description: The list of tanks.
 *         totalCount:
 *           type: integer
 *           description: The total number of tanks.
 *           example: 22
 */
