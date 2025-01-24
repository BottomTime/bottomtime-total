import {
  Injectable,
  Logger,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';

import { ZodType, ZodTypeDef } from 'zod';

@Injectable()
export class ZodValidator<T> implements PipeTransform {
  private readonly log = new Logger(ZodValidator.name);

  constructor(private readonly zodSchema: ZodType<T, ZodTypeDef, unknown>) {}

  transform(value: unknown): T {
    this.log.verbose('Validating raw object:', value);
    return this.zodSchema.parse(value);
  }
}

@Injectable()
export class ZodParamValidator<T> implements PipeTransform {
  private readonly log = new Logger(ZodParamValidator.name);

  constructor(private readonly zodSchema: ZodType<T, ZodTypeDef, unknown>) {}

  transform(value: unknown): T {
    this.log.verbose('Validating raw object:', value);

    const parsed = this.zodSchema.safeParse(value);
    if (parsed.success) {
      return parsed.data;
    }

    this.log.debug('Failed to validate parameter:', parsed.error.issues);

    throw new NotFoundException(
      'The requested resource could not be found. This is likely caused by an invalid route parameter.',
    );
  }
}
