import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeatureEntity } from '../data';
import { FeaturesService } from './features.service';

export class FeaturesModule {
  static forRoot(): DynamicModule {
    return {
      module: FeaturesModule,
      imports: [TypeOrmModule.forFeature([FeatureEntity])],
      providers: [FeaturesService],
    };
  }

  static forFeature(...keys: string[]): DynamicModule {
    const providers = [
      FeaturesService,
      ...keys.map((feature) => ({
        provide: `feature_${feature}`,
        useFactory: (service: FeaturesService) => service.getFeature(feature),
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
