import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeatureEntity } from '../data';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';

@Module({})
export class FeaturesModule {
  static forRoot(): DynamicModule {
    return {
      module: FeaturesModule,
      imports: [TypeOrmModule.forFeature([FeatureEntity])],
      controllers: [FeaturesController],
      providers: [FeaturesService],
    };
  }

  static forFeature(...keys: string[]): DynamicModule {
    const providers = [
      FeaturesService,
      ...keys.map((key) => ({
        provide: `bt_feature_${key}`,
        useFactory: (service: FeaturesService) => service.getFeature(key),
        inject: [FeaturesService],
      })),
    ];
    return {
      ...FeaturesModule.forRoot(),
      providers,
      exports: providers,
    };
  }
}
