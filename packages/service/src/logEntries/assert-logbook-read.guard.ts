import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// TODO: Check to see if the current user can access the target user's logbook.
@Injectable()
export class AssertLogbookRead implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
