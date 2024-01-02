import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AssertAdmin, AssertAuth } from '../auth';
import {
  CreateOrUpdateTankParamsDTO,
  CreateOrUpdateTankParamsSchema,
  ListTanksResponseDTO,
  TankDTO,
} from '@bottomtime/api';
import { TanksService } from '../tanks/tanks.service';
import { ZodValidator } from '../zod-validator';

@Controller('api/admin/tanks')
export class AdminTanksController {
  constructor(private readonly tanksService: TanksService) {}

  @Get()
  @UseGuards(AssertAuth)
  async listTanks(): Promise<ListTanksResponseDTO> {
    const tankData = await this.tanksService.listTanks();
    return {
      tanks: tankData.tanks.map((tank) => tank.toJSON()),
      totalCount: tankData.totalCount,
    };
  }

  @Get(':tankId')
  @UseGuards(AssertAuth)
  async getTank(@Param('tankId') tankId: string): Promise<TankDTO> {
    const tank = await this.tanksService.getTank(tankId);

    if (!tank) {
      throw new NotFoundException(`Tank with ID "${tankId}" not found.`);
    }

    return tank.toJSON();
  }

  @Post()
  @HttpCode(201)
  @UseGuards(AssertAdmin)
  async createTank(
    @Body(new ZodValidator(CreateOrUpdateTankParamsSchema))
    options: CreateOrUpdateTankParamsDTO,
  ): Promise<TankDTO> {
    const tank = await this.tanksService.createTank(options);
    return tank.toJSON();
  }

  @Put(':tankId')
  @UseGuards(AssertAdmin)
  async updateTank(
    @Param('tankId') tankId: string,
    @Body(new ZodValidator(CreateOrUpdateTankParamsSchema))
    options: CreateOrUpdateTankParamsDTO,
  ): Promise<TankDTO> {
    const tank = await this.tanksService.getTank(tankId);

    if (!tank) {
      throw new NotFoundException(`Tank with ID "${tankId}" not found.`);
    }

    tank.material = options.material;
    tank.name = options.name;
    tank.volume = options.volume;
    tank.workingPressure = options.workingPressure;
    await tank.save();

    return tank.toJSON();
  }

  @Delete(':tankId')
  @HttpCode(204)
  @UseGuards(AssertAdmin)
  async deleteTank(@Param('tankId') tankId: string): Promise<void> {
    const tank = await this.tanksService.getTank(tankId);

    if (!tank) {
      throw new NotFoundException(`Tank with ID "${tankId}" not found.`);
    }

    await tank.delete();
  }
}
