import { SearchDiveOperatorsResponseDTO } from '@bottomtime/api';

import { Controller, Get, Inject } from '@nestjs/common';

import { DiveOperatorsService } from './dive-operators.service';

@Controller('api/operators')
export class DiveOperatorsController {
  constructor(
    @Inject(DiveOperatorsService)
    private readonly service: DiveOperatorsService,
  ) {}

  /**
   * @openapi
   * /api/operators:
   *   get:
   *     summary: Search for dive operators
   *     operationId: searchDiveOperators
   *     description: |
   *       Performs a search for dive operators given the criteria specified in the query string.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - in: query
   *         name: query
   *         description: |
   *           A search query to perform a text-base search on. Will search within the operator's name, description, and address.
   *           If omitted, all dive operators will be matched by the search.
   *         required: false
   *         example: "Puget Sound"
   *         schema:
   *           type: string
   *       - in: query
   *         name: location
   *         description: |
   *           The GPS coordinates to use as the center of the search radius. Must be specified in the format `<latitude>,<longitude>`.
   *           If omitted, the search results will not be filtered on location.
   *         required: false
   *         example: 47.6062,-122.3321
   *         schema:
   *           $ref: "#/components/schemas/GpsCoordinates"
   *       - in: query
   *         name: radius
   *         description: |
   *           The search radius in km about the search `location`. If the `location` parameter is omitted, this parameter will be ignored.
   *           The default is 50km.
   *         required: false
   *         example: 100
   *         schema:
   *           type: number
   *           format: float
   *           minimum: 10
   *           maximum: 500
   *           default: 50
   *       - in: query
   *         name: skip
   *         description: |
   *           The number of results to skip before returning the first result. Used for pagination.
   *           The default is 0.
   *         required: false
   *         example: 40
   *         schema:
   *           type: number
   *           format: int32
   *           minimum: 0
   *           default: 0
   *       - in: query
   *         name: limit
   *         description: |
   *           The maximum number of results to return. Used for pagination.
   *           The default is 50.
   *         required: false
   *         example: 20
   *         schema:
   *           type: number
   *           format: int32
   *           minimum: 1
   *           maximum: 500
   *           default: 50
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - operators
   *                 - totalCount
   *               properties:
   *                 operators:
   *                   type: array
   *                   name: Dive Operators
   *                   description: A list of dive operators that matched the search criteria.
   *                   items:
   *                     $ref: "#/components/schemas/SuccinctDiveOperator"
   *                 totalCount:
   *                   type: integer
   *                   name: Total Count
   *                   description: The total number of results that matched the search criteria.
   *                   format: int32
   *       400:
   *         description: The request failed because the query string was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async searchDiveOperators(): Promise<SearchDiveOperatorsResponseDTO> {
    const results = await this.service.searchOperators();
    return {
      operators: results.operators.map((op) => op.toJSON()),
      totalCount: results.totalCount,
    };
  }

  createDiveOperator() {}

  getDiveOperator() {}

  updateDiveOperator() {}

  deleteDiveOperator() {}
}
