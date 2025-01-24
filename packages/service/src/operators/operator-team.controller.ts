import {
  ApiList,
  CreateOrUpdateTeamMemberDTO,
  CreateOrUpdateTeamMemberSchema,
  SuccessCountDTO,
  TeamMemberDTO,
  UsernameSchema,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from '../users';
import { ZodParamValidator, ZodValidator } from '../zod-validator';
import { AssertOperatorOwner } from './assert-operator-owner.guard';
import { AssertOperator, TargetOperator } from './assert-operator.guard';
import { Operator } from './operator';

const TeamMemberParam = 'teamMember';
const TeamMemberKey = `:${TeamMemberParam}`;

@Controller('api/operators/:operatorKey/team')
@UseGuards(AssertOperator)
export class OperatorTeamController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  /**
   * @openapi
   * /api/operators/{operatorKey}/team:
   *   get:
   *     summary: List team members
   *     operationId: listOperatorTeamMembers
   *     description: |
   *       List all members of the operator's team.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     responses:
   *       "200":
   *         description: The request succeeded and the list of team members will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - data
   *                 - totalCount
   *               properties:
   *                 data:
   *                   type: array
   *                   description: The list of team members.
   *                   items:
   *                     $ref: "#/components/schemas/DiveOperatorTeamMember"
   *                 totalCount:
   *                   type: integer
   *                   description: The total number of team members.
   *                   example: 18
   *       "404":
   *         description: The request failed because the indicated operator does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async listTeamMembers(
    @TargetOperator() operator: Operator,
  ): Promise<ApiList<TeamMemberDTO>> {
    const teamMembers = await operator.teamMembers.listMembers();
    return {
      data: teamMembers.map((member) => member.toJSON()),
      totalCount: teamMembers.length,
    };
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/team:
   *   delete:
   *     summary: Remove team members (bulk)
   *     operationId: removeOperatorTeamMembers
   *     description: |
   *       Remove one or more members from the operator's team.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             description: The list of usernames matching team members to be removed.
   *             items:
   *               type: string
   *               minItems: 1
   *               maxItems: 200
   *             example:
   *               - alice
   *               - bob
   *               - charlie
   *     responses:
   *       "200":
   *         description: The request succeeded and the indicated team members have been removed.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - succeeded
   *                 - skipped
   *               properties:
   *                 succeeded:
   *                   type: integer
   *                   description: The number of team members that were successfully removed.
   *                   example: 8
   *                 skipped:
   *                   type: integer
   *                   description: |
   *                     The number of team members that were not removed (usernames did not match or were
   *                     ignored because of duplication).
   *                   example: 1
   *       "400":
   *         description: The request failed because the request body was invalid or missing or the array of usernames was empty.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the request was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the requestor is not authorized to remove team members from the
   *           indicated operator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the indicated operator does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete()
  @UseGuards(AssertOperatorOwner)
  async removeTeamMembers(
    @TargetOperator() operator: Operator,
    @Body(new ZodValidator(UsernameSchema.array().min(1).max(200)))
    usernames: string[],
  ): Promise<SuccessCountDTO> {
    const succeeded = await operator.teamMembers.removeMembers(usernames);

    return {
      succeeded,
      skipped: usernames.length - succeeded,
    };
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/team/{teamMember}:
   *   get:
   *     summary: Get team member
   *     operationId: getOperatorTeamMember
   *     description: |
   *       Retrieve details about a team member.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *       - $ref: "#/components/parameters/TeamMemberUsername"
   *     responses:
   *       "200":
   *         description: The request succeeded and the team member details will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveOperatorTeamMember"
   *       "404":
   *         description: The request failed because the indicated operator or team member does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(TeamMemberKey)
  async getTeamMember(
    @TargetOperator() operator: Operator,
    @Param(TeamMemberParam, new ZodParamValidator(UsernameSchema))
    teamMemberName: string,
  ): Promise<TeamMemberDTO> {
    const teamMember = await operator.teamMembers.getMember(teamMemberName);

    if (!teamMember) {
      throw new NotFoundException(`Team member not found: "${teamMemberName}"`);
    }

    return teamMember.toJSON();
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/team/{teamMember}:
   *   put:
   *     summary: Add or update team member
   *     operationId: addOrUpdateOperatorTeamMember
   *     description: |
   *       Add a new team member to the operator's team or update an existing team member's details.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *       - $ref: "#/components/parameters/TeamMemberUsername"
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateDiveOperatorTeamMember"
   *     responses:
   *       "200":
   *         description: |
   *           The request succeeded and the newly-created or freshly-updated team member info
   *           will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveOperatorTeamMember"
   *       "400":
   *         description: The request failed because the request body was invalid or missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the request was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the requestor is not authorized to add or update team members for the
   *           indicated operator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the indicated operator does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(TeamMemberKey)
  @UseGuards(AssertOperatorOwner)
  async addOrUpdateTeamMember(
    @TargetOperator() operator: Operator,
    @Param(TeamMemberParam, new ZodParamValidator(UsernameSchema))
    teamMemberName: string,
    @Body(new ZodValidator(CreateOrUpdateTeamMemberSchema))
    options: CreateOrUpdateTeamMemberDTO,
  ): Promise<TeamMemberDTO> {
    let teamMember = await operator.teamMembers.getMember(teamMemberName);

    if (teamMember) {
      teamMember.title = options.title;
      teamMember.joined = options.joined;
      await teamMember.save();
    } else {
      const user = await this.users.getUserByUsernameOrEmail(teamMemberName);
      if (!user) {
        throw new NotFoundException(
          `No such user with username "${teamMemberName}".`,
        );
      }

      teamMember = await operator.teamMembers.addMember({
        ...options,
        member: user,
      });
    }

    return teamMember.toJSON();
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/team/{teamMember}:
   *   delete:
   *     summary: Remove team member
   *     operationId: removeOperatorTeamMember
   *     description: |
   *       Remove a member from the operator's team.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *       - $ref: "#/components/parameters/TeamMemberUsername"
   *     responses:
   *       "204":
   *         description: The request succeeded and the indicated team member has been removed.
   *       "401":
   *         description: The request failed because the request was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the requestor is not authorized to remove team members from the
   *           indicated operator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the indicated operator or team member does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(TeamMemberKey)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AssertOperatorOwner)
  async removeTeamMember(
    @TargetOperator() operator: Operator,
    @Param(TeamMemberParam, new ZodParamValidator(UsernameSchema))
    teamMemberName: string,
  ): Promise<void> {
    const teamMember = await operator.teamMembers.getMember(teamMemberName);

    if (!teamMember) {
      throw new NotFoundException(`Team member not found: "${teamMemberName}"`);
    }

    await teamMember.delete();
  }
}
