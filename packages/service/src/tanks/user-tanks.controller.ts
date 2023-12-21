import { Controller, UseGuards } from '@nestjs/common';
import { TanksService } from './tanks.service';
import { ApiTags } from '@nestjs/swagger';
import { AssertTankOwner } from './assert-tank-owner.guard';

@Controller('api/users/:username/tanks')
@UseGuards(AssertTankOwner)
@ApiTags('Users', 'Tanks')
export class UserTanksController {
  constructor(private readonly tanksService: TanksService) {}
}
