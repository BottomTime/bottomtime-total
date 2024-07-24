import { Inject } from '@nestjs/common';

export const InjectFeature = (key: string) => Inject(`bt_feature_${key}`);
