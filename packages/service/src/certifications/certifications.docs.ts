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
 *         example: 3fe0868e-3b88-4ecc-907a-0e92e886cfae
 *     AgencyId:
 *       name: agencyId
 *       in: path
 *       required: true
 *       description: The agency's unique ID.
 *       schema:
 *         type: string
 *         format: uuid
 *         example: 57ac305a-beb1-4fcd-a96c-bb16ed5687cd
 *     ProfessionalAssociationId:
 *       name: associationId
 *       in: path
 *       required: true
 *       description: The professional association's unique ID.
 *       schema:
 *         type: string
 *         format: uuid
 *         example: 57ac305a-beb1-4fcd-a96c-bb16ed5687cd
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
 *   schemas:
 *     CreateOrUpdateAgency:
 *       type: object
 *       required:
 *         - name
 *         - logo
 *         - website
 *       properties:
 *         name:
 *           title: Short Name (Abbreviation)
 *           type: string
 *           pattern: "^[\\w\\s]+$"
 *           maxLength: 200
 *           description: The agency's short name.
 *           example: PADI
 *         longName:
 *           title: Full Name
 *           type: string
 *           maxLength: 200
 *           description: The agency's full name.
 *           example: Professional Association of Diving Instructors
 *         logo:
 *           title: Logo URL
 *           type: string
 *           maxLength: 250
 *           description: |
 *             The URL of the agency's logo. Ideally, it should be a 256x256 pixel image.
 *           example: https://example.com/logo.png
 *         website:
 *           title: Website URL
 *           type: string
 *           format: uri
 *           maxLength: 250
 *           description: The URL of the agency's website.
 *           example: https://padidive.com
 *     Agency:
 *       allOf:
 *         - type: object
 *           required:
 *             - id
 *           properties:
 *             id:
 *               title: Agency ID
 *               type: string
 *               format: uuid
 *               description: A unique ID used to identify the agency in API calls.
 *               example: 39910b4a-73e8-4155-9b49-5782307c6951
 *         - $ref: "#/components/schemas/CreateOrUpdateAgency"
 *     UpdateCertification:
 *       type: object
 *       required:
 *         - agency
 *         - course
 *       properties:
 *         agency:
 *           $ref: "#/components/schemas/Agency"
 *           title: Agency
 *           description: The certification's agency.
 *         course:
 *           title: Course
 *           type: string
 *           description: The course title or name of the certification.
 *           example: Open Water Diver
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
 *     ProfessionalAssociation:
 *       type: object
 *       required:
 *         - agency
 *         - identificationNumber
 *         - startDate
 *         - title
 *       properties:
 *         id:
 *           title: Association ID
 *           type: string
 *           format: uuid
 *           description: The professional association's unique ID.
 *           example: 223e89de-1b92-4f72-b110-7ec074c3d43b
 *         agency:
 *           $ref: "#/components/schemas/Agency"
 *           title: Agency
 *           description: The professional association's agency.
 *         identificationNumber:
 *           title: Identification Number
 *           type: string
 *           description: |
 *             The professional association's identification number. (E.g. PADI Pro number)
 *           example: 123456
 *         startDate:
 *           title: Start Date
 *           type: string
 *           format: date
 *           description: The professional association's start date.
 *           example: 2021-01-01
 *         title:
 *           title: Title
 *           type: string
 *           description: The professional association's title.
 *           example: Divemaster
 */
