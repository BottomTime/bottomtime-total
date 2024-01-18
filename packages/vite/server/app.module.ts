import { Module } from '@nestjs/common';
import { WebModule } from './web';
import { ViteDevServer } from 'vite';

export type ServerDependencies = {
  vite?: ViteDevServer;
};

@Module({
  imports: [WebModule],
})
export class AppModule {}
