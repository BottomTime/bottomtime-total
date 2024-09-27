import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewaySimpleAuthorizerResult,
  Callback,
  Context,
  Handler,
} from 'aws-lambda';

import { Config } from './config';
import { createLogger } from './logger';

const log = createLogger(Config.logLevel);

export const handler: Handler = async (
  request: APIGatewayRequestAuthorizerEvent,
  context: Context,
  cb: Callback,
): Promise<APIGatewaySimpleAuthorizerResult> => {
  log.info(request);
  return { isAuthorized: false };
};
