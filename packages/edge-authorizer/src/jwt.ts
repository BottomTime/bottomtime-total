import { APIGatewayRequestAuthorizerEvent } from 'aws-lambda';

export function extractToken(
  request: APIGatewayRequestAuthorizerEvent,
): string | null {
  const cookies = request.headers ? request.headers['Cookie'] : null;
  return null;
}

export function validateToken() {}
