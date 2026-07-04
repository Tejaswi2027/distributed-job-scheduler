export abstract class BaseError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string, public readonly details: any = null) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends BaseError {
  readonly statusCode = 400;
}

export class AuthenticationError extends BaseError {
  readonly statusCode = 401;
}

export class AuthorizationError extends BaseError {
  readonly statusCode = 403;
}

export class NotFoundError extends BaseError {
  readonly statusCode = 404;
}

export class ConflictError extends BaseError {
  readonly statusCode = 409;
}

export class DatabaseError extends BaseError {
  readonly statusCode = 500;
}

export class RetryError extends BaseError {
  readonly statusCode = 500;
}

export class WorkerError extends BaseError {
  readonly statusCode = 500;
}
