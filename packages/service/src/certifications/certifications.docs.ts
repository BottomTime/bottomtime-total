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
 *     CertificationQuery:
 *       name: query
 *       in: query
 *       description: A search query string to look for. If omitted, all certifications will be returned.
 *       schema:
 *         type: string
 *       example: nitrox
 *     CertificationAgency:
 *       name: agency
 *       in: query
 *       description: The agency to filter by. Only certifications from this agency will be returned. If omitted, all certifications will be returned.
 *       schema:
 *         type: string
 *       example: PADI
 *     CertificationSkip:
 *       name: skip
 *       in: query
 *       description: The number of matching results to skip over. Use this for pagination of results. Defaults to 0.
 *       schema:
 *         type: integer
 *         minimum: 0
 *       default: 0
 *       example: 0
 *     CertificationLimit:
 *       name: limit
 *       in: query
 *       description: The maximum number of matching results to return. Use this for pagination of results. Defaults to 100.
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 400
 *       default: 100
 *       example: 100
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
