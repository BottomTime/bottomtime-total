import { ApiClientOptions } from '@bottomtime/api';

import { StateTree } from 'pinia';

export type PageOptions = {
  appTitle: string;
  pageTitle: string;
  head: string;
  content: string;
  initialState: string;
};

export type RenderResult = {
  head?: string;
  html: string;
  initialState: string;
};

export type RenderFunc = (
  url: string,
  initialState: Record<string, StateTree>,
  clientOptions: ApiClientOptions,
) => Promise<RenderResult>;
