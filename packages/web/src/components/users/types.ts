import { NotificationDTO } from '@bottomtime/api';

export type NotificationWithSelection = NotificationDTO & { selected: boolean };
