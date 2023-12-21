import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TanksService } from './tanks.service';

@Injectable()
export class AssertTankOwner implements CanActivate {
  constructor(private readonly tanksService: TanksService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
