import { Controller, Delete, Get, Post, Put } from '@nestjs/common';

@Controller('api/tanks')
export class TanksController {
  @Get()
  async listTanks(): Promise<void> {}

  @Get(':tankId')
  async getTank(): Promise<void> {}

  @Post()
  async createTank(): Promise<void> {}

  @Put(':tankId')
  async updateTank(): Promise<void> {}

  @Delete(':tankId')
  async deleteTank(): Promise<void> {}
}
