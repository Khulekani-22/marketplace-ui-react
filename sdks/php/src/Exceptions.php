<?php

namespace Marketplace\SDK;

/**
 * Base exception for Marketplace SDK
 */
class MarketplaceException extends \Exception
{
    protected ?int $statusCode;

    public function __construct(string $message, ?int $statusCode = null, ?\Throwable $previous = null)
    {
        parent::__construct($message, $statusCode ?? 0, $previous);
        $this->statusCode = $statusCode;
    }

    public function getStatusCode(): ?int
    {
        return $this->statusCode;
    }
}

class AuthenticationException extends MarketplaceException {}

class AuthorizationException extends MarketplaceException {}

class NotFoundException extends MarketplaceException {}

class ValidationException extends MarketplaceException
{
    private ?array $errors;

    public function __construct(string $message, ?array $errors = null, ?int $statusCode = null, ?\Throwable $previous = null)
    {
        parent::__construct($message, $statusCode, $previous);
        $this->errors = $errors;
    }

    public function getErrors(): ?array
    {
        return $this->errors;
    }
}

class RateLimitException extends MarketplaceException
{
    private int $retryAfter;

    public function __construct(string $message, int $retryAfter, ?int $statusCode = null, ?\Throwable $previous = null)
    {
        parent::__construct($message, $statusCode, $previous);
        $this->retryAfter = $retryAfter;
    }

    public function getRetryAfter(): int
    {
        return $this->retryAfter;
    }
}

class NetworkException extends MarketplaceException {}
