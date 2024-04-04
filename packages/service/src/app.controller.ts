import { Controller, Get } from '@nestjs/common';

type PingResponse = {
  api: string;
  apiVersion: string;
  uptime: number;
};

@Controller()
export class AppController {
  @Get()
  getPing(): PingResponse {
    return {
      api: 'Bottom Time Service',
      apiVersion: '1.0.0',
      uptime: Math.ceil(process.uptime() * 1000),
    };
  }
}
