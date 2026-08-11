/**
 * Application-level HTTP error type.
 *
 * Only errors of this class have their message forwarded to the client. Every
 * other thrown value is reported as a generic 500 so that internal details
 * (stack traces, driver messages, connection strings) never leak.
 *
 * @module lib/api/ApiError
 */

/** Field-level validation messages, keyed by form field path. */
export type FieldErrors = Record<string, string>;

/** An error that carries an intentional, client-safe HTTP status and message. */
export class ApiError extends Error {
  /** HTTP status code to send. */
  public readonly status: number;
  /** Optional per-field validation messages. */
  public readonly details?: FieldErrors;

  /**
   * @param status - HTTP status code.
   * @param message - Client-safe message.
   * @param details - Optional field-level validation errors.
   */
  constructor(status: number, message: string, details?: FieldErrors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  /** 400 — the request body or query was invalid. */
  static badRequest(message = 'Invalid request', details?: FieldErrors): ApiError {
    return new ApiError(400, message, details);
  }

  /** 401 — no valid admin session was supplied. */
  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message);
  }

  /** 403 — authenticated, but the role is insufficient. */
  static forbidden(message = 'You do not have permission to perform this action'): ApiError {
    return new ApiError(403, message);
  }

  /** 404 — the addressed resource does not exist. */
  static notFound(resource = 'Resource'): ApiError {
    return new ApiError(404, `${resource} not found`);
  }

  /** 409 — the request conflicts with existing state (e.g. duplicate name). */
  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(409, message);
  }
}
