import { Fetcher } from './fetcher';

export type ApiClientOptions = {
  authToken?: string;
  baseURL?: string;
  edgeAuthToken?: string;
  fetcher?: Fetcher;
};
