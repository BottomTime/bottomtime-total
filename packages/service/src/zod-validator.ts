import { Injectable, Logger, PipeTransform } from '@nestjs/common';
import { ZodType, ZodTypeDef } from 'zod';

@Injectable()
export class ZodValidator<T> implements PipeTransform {
  private readonly log = new Logger(ZodValidator.name);

  constructor(private readonly zodSchema: ZodType<T, ZodTypeDef, unknown>) {}

  transform(value: unknown): T {
    this.log.debug('Validating raw object:', value);
    return this.zodSchema.parse(value);
  }
}
