import { Module } from '@nestjs/common';
import { ViteModule } from '../vite';
import { ApiModule } from '../api';
import { HomeController } from './home.controller';

@Module({
  imports: [ApiModule, ViteModule.forFeature()],
  controllers: [HomeController],
})
export class WebModule {}
