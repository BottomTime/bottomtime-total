export interface Feature<T extends boolean | string | number> {
  readonly key: string;
  readonly defaultValue: T;
}

/** DEFINE FEATURES BELOW **/

export class NotificationsFeature implements Feature<boolean> {
  readonly key = 'notifications';
  readonly defaultValue = false;
}

export class ManageDiveOperatorsFeature implements Feature<boolean> {
  readonly key = 'manageDiveOperators';
  readonly defaultValue = false;
}
