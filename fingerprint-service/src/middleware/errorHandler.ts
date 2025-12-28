import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
