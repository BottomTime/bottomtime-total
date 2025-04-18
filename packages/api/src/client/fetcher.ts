import qs from 'fast-querystring';
import { ZodType, ZodTypeDef } from 'zod';

import { ErrorResponseSchema } from '../types';
import { ApiClientOptions } from './api-client-options';
import { HttpException } from './errors';

export type HttpMethod =
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

export type SendRequestOptions = {
  body?: unknown;
  params?: Record<string, unknown>;
  ignoreErrors?: boolean;
};

export type ApiResponse<T> = {
  data: T;
  status: number;
  statusText: string;
};

export class Fetcher {
  private readonly headers: HeadersInit;

  constructor(private readonly options: ApiClientOptions = {}) {
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.options.authToken) {
      this.headers.Authorization = `Bearer ${this.options.authToken}`;
    }

    if (this.options.edgeAuthToken) {
      this.headers['x-bt-auth'] = this.options.edgeAuthToken;
    }
  }

  private getFullUrl(url: string, query?: Record<string, unknown>): string {
    let fullUrl = url;

    if (this.options.baseURL) {
      fullUrl = new URL(url, this.options.baseURL).toString();
    }

    if (query) {
      fullUrl = `${fullUrl}?${qs.stringify(JSON.parse(JSON.stringify(query)))}`;
    }

    return fullUrl;
  }

  private async parseResponseBody<T>(
    res: Response,
    parser?: ZodType<T, ZodTypeDef, unknown>,
  ): Promise<T> {
    let json: unknown;

    try {
      json = await res.json();
    } catch (error) {
      json = {};
    }

    return parser ? parser.parse(json) : (json as T);
  }

  private async checkResponseForErrors(response: Response): Promise<void> {
    if (response.ok) return;

    const body = await this.parseResponseBody(response, ErrorResponseSchema);
    throw new HttpException(
      response.status,
      response.statusText,
      body.message,
      body,
    );
  }

  private async sendRequest(
    method: HttpMethod,
    url: string,
    options?: SendRequestOptions,
  ): Promise<Response> {
    const response = await fetch(this.getFullUrl(url, options?.params), {
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
      method,
      headers: this.headers,
    });

    if (!options?.ignoreErrors) await this.checkResponseForErrors(response);
    return response;
  }

  async delete<T>(
    url: string,
    params?: unknown,
    parser?: ZodType<T, ZodTypeDef, unknown>,
  ): Promise<ApiResponse<T>> {
    const response = await this.sendRequest('DELETE', url, { body: params });
    const data = await this.parseResponseBody<T>(response, parser);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }

  async get<T>(
    url: string,
    query?: Record<string, unknown>,
    parser?: ZodType<T, ZodTypeDef, unknown>,
  ): Promise<ApiResponse<T>> {
    const response = await this.sendRequest('GET', url, { params: query });
    const data = await this.parseResponseBody<T>(response, parser);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }

  async head(url: string): Promise<number> {
    const { status } = await this.sendRequest('HEAD', url, {
      ignoreErrors: true,
    });
    return status;
  }

  async patch<T>(
    url: string,
    params?: unknown,
    parser?: ZodType<T, ZodType, unknown>,
  ): Promise<ApiResponse<T>> {
    const response = await this.sendRequest('PATCH', url, { body: params });
    const data = await this.parseResponseBody<T>(response, parser);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }

  async post<T>(
    url: string,
    params?: unknown,
    parser?: ZodType<T, ZodTypeDef, unknown>,
  ): Promise<ApiResponse<T>> {
    const response = await this.sendRequest('POST', url, { body: params });
    const data = await this.parseResponseBody<T>(response, parser);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }

  async postFormData<T>(
    url: string,
    formData: FormData,
  ): Promise<ApiResponse<T>> {
    const response = await fetch(this.getFullUrl(url), {
      body: formData,
      credentials: 'include',
      method: 'POST',
      headers: {
        ...(this.options.authToken
          ? { Authorization: `Bearer ${this.options.authToken}` }
          : {}),
      },
    });

    await this.checkResponseForErrors(response);
    const data = await this.parseResponseBody<T>(response);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }

  async put<T>(
    url: string,
    params?: unknown,
    parser?: ZodType<T, ZodTypeDef, unknown>,
  ): Promise<ApiResponse<T>> {
    const response = await this.sendRequest('PUT', url, { body: params });
    const data = await this.parseResponseBody<T>(response, parser);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }
}
