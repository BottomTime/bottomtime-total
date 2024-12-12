import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';
import { RedisClientType } from 'redis';
import { lastValueFrom } from 'rxjs';

import { Config } from './config';
import { RedisClient } from './dependencies';
import { GeolocationData } from './types/geolocation';

const RedisKey = 'geolocation';

@Injectable()
export class GeolocationMiddleware implements NestMiddleware {
  private readonly log = new Logger(GeolocationMiddleware.name);

  constructor(
    @Inject(HttpService) private readonly http: HttpService,
    @Inject(RedisClient) private readonly redis: RedisClientType,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      // Skip look up if the API key is not set or the request has no IP to lookup.
      if (!Config.ipGeolocationApiKey || !req.ip) return next();

      // Attempt to retrieve data from Redis.
      const json = await this.redis.hGet(RedisKey, req.ip);
      if (json) {
        this.log.debug(`Geolocation cache hit for IP "${req.ip}"`);
        req.geolocation = JSON.parse(json);
        return next();
      }

      // If there is no cache hit we'll make an API request...
      this.log.debug(`Attempting IP Geolocation lookup for IP "${req.ip}"...`);
      const { data: response } = await lastValueFrom(
        this.http.get<GeolocationData>('https://api.ipgeolocation.io/ipgeo', {
          params: {
            apiKey: Config.ipGeolocationApiKey,
            ip: req.ip,
          },
        }),
      );
      req.geolocation = response;

      // ...and cache the response for future requests.
      await this.redis.hSet(RedisKey, req.ip, JSON.stringify(response));

      next();
    } catch (error) {
      // Log errors but don't interrupt the request.
      this.log.error(error);
      next();
    }
  }
}
