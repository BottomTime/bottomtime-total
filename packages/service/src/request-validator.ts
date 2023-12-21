import { Injectable, PipeTransform } from '@nestjs/common';
import { ZodType, ZodTypeDef } from 'zod';

@Injectable()
export class ZodValidator<T> implements PipeTransform {
  constructor(private readonly zodSchema: ZodType<T, ZodTypeDef, unknown>) {}

  transform(value: unknown): T {
    return this.zodSchema.parse(value);
  }
}
