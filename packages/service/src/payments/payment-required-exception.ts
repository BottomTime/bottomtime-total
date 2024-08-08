import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentRequiredException extends HttpException {
  constructor(message?: string) {
    super(message || 'Payment required', HttpStatus.PAYMENT_REQUIRED);
    Object.setPrototypeOf(this, PaymentRequiredException.prototype);
  }
}
