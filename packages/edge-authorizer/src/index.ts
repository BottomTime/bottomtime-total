import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewaySimpleAuthorizerResult,
  Callback,
  Context,
  Handler,
} from 'aws-lambda';

export const handler: Handler = async (
  request: APIGatewayRequestAuthorizerEvent,
  context: Context,
  cb: Callback,
): Promise<APIGatewaySimpleAuthorizerResult> => {
  return { isAuthorized: true };
};
