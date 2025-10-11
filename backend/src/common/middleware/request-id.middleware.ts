import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

const HEADER_NAME = 'x-request-id';

export function requestIdMiddleware(
  req: Request & { requestId?: string },
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers[HEADER_NAME];
  const candidate = Array.isArray(incoming)
    ? incoming.find((value) => typeof value === 'string' && value.length)
    : typeof incoming === 'string' && incoming.length
    ? incoming
    : undefined;

  const finalId = candidate ?? randomUUID();

  req.requestId = finalId;
  res.setHeader('X-Request-ID', finalId);
  next();
}
