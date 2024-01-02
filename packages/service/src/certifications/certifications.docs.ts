/**
 * @openapi
 * components:
 *   parameters:
 *     CertificationId:
 *       name: certificationId
 *       in: path
 *       required: true
 *       description: The certification's unique ID.
 *       schema:
 *         type: string
 *         format: uuid
 *         example: 00000000-0000-0000-0000-000000000000
 *
 *   schemas:
 *     UpdateCertification:
 *       type: object
 *       required:
 *         - agency
 *         - course
 *       properties:
 *         agency:
 *           title: Agency
 *           type: string
 *           description: The certification's agency.
 *           example: PADI
 *         course:
 *           title: Course
 *           type: string
 *           description: The certification's course.
 *           example: Open Water Diver
 *
 *     Certification:
 *       allOf:
 *         - $ref: "#/components/schemas/UpdateCertification"
 *         - type: object
 *           required:
 *             - id
 *           properties:
 *             id:
 *               title: ID
 *               type: string
 *               format: uuid
 *               description: The certification's unique ID.
 *               example: 00000000-0000-0000-0000-000000000000
 */
