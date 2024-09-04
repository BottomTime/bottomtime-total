import { Module } from '@nestjs/common';

import { AWSModule } from '../dependencies';
import { StorageService } from './storage.service';

@Module({
  imports: [AWSModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
