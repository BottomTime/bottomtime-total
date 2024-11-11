export type FlagValue = boolean | string | number;

export interface Feature<T extends FlagValue> {
  readonly key: string;
  readonly defaultValue: T;
}

/** DEFINE FEATURES BELOW **/

export const NotificationsFeature: Feature<boolean> = {
  key: 'notifications',
  defaultValue: false,
};
