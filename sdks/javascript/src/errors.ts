/* eslint-disable no-unused-vars */
/**
 * Custom error classes for Marketplace SDK
 */

export class MarketplaceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'MarketplaceError';
    Object.setPrototypeOf(this, MarketplaceError.prototype);
  }
}

export class AuthenticationError extends MarketplaceError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends MarketplaceError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends MarketplaceError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends MarketplaceError {
  constructor(message = 'Validation failed', public errors?: any) {
    super(message, 400);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class RateLimitError extends MarketplaceError {
  constructor(
    message = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class NetworkError extends MarketplaceError {
  constructor(message = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
