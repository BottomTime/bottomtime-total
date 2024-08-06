import {
  ClientCacheState,
  HookEvents,
  IConfigCatClient,
  IConfigCatClientSnapshot,
  IEvaluationDetails,
  RefreshResult,
  SettingKeyValue,
  SettingTypeOf,
  SettingValue,
} from 'configcat-node';

export type FeatureFlagsMap = Record<string, boolean | string | number | null>;

export class ConfigCatClientMock implements IConfigCatClient {
  private _flags: FeatureFlagsMap;

  constructor(flags?: FeatureFlagsMap) {
    this._flags = flags ?? {};
  }

  get flags(): FeatureFlagsMap {
    return this._flags;
  }
  set flags(value: FeatureFlagsMap) {
    this._flags = value;
  }

  getValueAsync<T extends SettingValue>(
    key: string,
    defaultValue: T,
  ): Promise<SettingTypeOf<T>> {
    const flag = this._flags[key];

    if (flag !== undefined) {
      return Promise.resolve(flag as SettingTypeOf<T>);
    }

    return Promise.resolve(defaultValue as SettingTypeOf<T>);
  }

  getValueDetailsAsync<T extends SettingValue>(): Promise<
    IEvaluationDetails<SettingTypeOf<T>>
  > {
    throw new Error('Method not implemented.');
  }

  getAllKeysAsync(): Promise<string[]> {
    return Promise.resolve(Object.keys(this._flags));
  }

  getAllValuesAsync(): Promise<SettingKeyValue[]> {
    return Promise.resolve(
      Object.entries(this._flags).map(([settingKey, settingValue]) => ({
        settingKey,
        settingValue,
      })),
    );
  }

  getAllValueDetailsAsync(): Promise<IEvaluationDetails[]> {
    throw new Error('Method not implemented.');
  }

  getKeyAndValueAsync(): Promise<SettingKeyValue | null> {
    throw new Error('Method not implemented.');
  }

  forceRefreshAsync(): Promise<RefreshResult> {
    return Promise.resolve(RefreshResult.success());
  }

  waitForReady(): Promise<ClientCacheState> {
    throw new Error('Method not implemented.');
  }

  snapshot(): IConfigCatClientSnapshot {
    throw new Error('Method not implemented.');
  }

  setDefaultUser(): void {
    throw new Error('Method not implemented.');
  }

  clearDefaultUser(): void {
    throw new Error('Method not implemented.');
  }

  isOffline: boolean = false;

  setOnline(): void {
    throw new Error('Method not implemented.');
  }

  setOffline(): void {
    throw new Error('Method not implemented.');
  }

  dispose(): void {
    throw new Error('Method not implemented.');
  }

  addListener(): this {
    return this;
  }

  on(): this {
    return this;
  }

  once(): this {
    return this;
  }

  removeListener(): this {
    return this;
  }

  off(): this {
    return this;
  }

  removeAllListeners(): this {
    return this;
  }

  /* eslint-disable-next-line @typescript-eslint/ban-types */
  listeners(): Function[] {
    throw new Error('Method not implemented.');
  }
  listenerCount(): number {
    throw new Error('Method not implemented.');
  }
  eventNames(): Array<keyof HookEvents> {
    throw new Error('Method not implemented.');
  }
}
