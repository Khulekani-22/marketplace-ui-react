<?php

namespace Marketplace\SDK;

/**
 * Webhook signature verification
 */
class WebhookVerifier
{
    private string $secret;

    public function __construct(string $secret)
    {
        $this->secret = $secret;
    }

    /**
     * Verify webhook signature
     */
    public function verify($payload, string $signature): bool
    {
        $expectedSignature = $this->generateSignature($payload);
        
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Generate signature for payload
     */
    public function generateSignature($payload): string
    {
        $json = is_string($payload) ? $payload : json_encode($payload, JSON_UNESCAPED_SLASHES);
        return hash_hmac('sha256', $json, $this->secret);
    }

    /**
     * Verify webhook request
     */
    public function verifyRequest($body, string $signatureHeader): bool
    {
        if (empty($signatureHeader)) {
            return false;
        }

        return $this->verify($body, $signatureHeader);
    }
}
