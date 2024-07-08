import { Fetcher } from './fetcher';

export type ApiClientOptions = {
  authToken?: string;
  fetcher?: Fetcher;
  baseURL?: string;
};
