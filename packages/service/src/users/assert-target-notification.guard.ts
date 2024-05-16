import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { User } from '../auth/user';
import { Notification } from './notification';
import { NotificationsService } from './notifications.service';

@Injectable()
export class AssertTargetNotification implements CanActivate {
  private readonly log = new Logger(AssertTargetNotification.name);

  constructor(
    @Inject(NotificationsService)
    private readonly service: NotificationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    this.log.debug(
      `Received request to act on notification with ID "${req.params.notificationId}" belonging to user "${req.params.username}".`,
    );

    const targetUser: User | undefined = req.targetUser;
    if (!targetUser) {
      throw new NotFoundException(
        `User with username or email "${req.params.username}" not found.`,
      );
    }

    const targetNotification = await this.service.getNotification(
      targetUser.id,
      req.params.notificationId,
    );

    if (!targetNotification) {
      throw new NotFoundException(
        `Notification with ID "${req.params.notificationId}" not found.`,
      );
    }

    req.targetNotification = targetNotification;
    return true;
  }
}

export const TargetNotification = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Notification => {
    const req = ctx.switchToHttp().getRequest();
    return req.targetNotification;
  },
);
