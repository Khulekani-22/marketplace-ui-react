# SDK Development Guide

This guide explains the SDK architecture, publishing process, and maintenance procedures for the Marketplace API SDKs.

## Overview

Official SDKs are available for:
- **JavaScript/TypeScript** - `@marketplace/sdk` on npm
- **PHP** - `marketplace/sdk` on Packagist

## JavaScript/TypeScript SDK

### Architecture

**Location:** `sdks/javascript/`

**Key Files:**
- `src/client.ts` - Main API client with all endpoint methods
- `src/types.ts` - TypeScript type definitions
- `src/errors.ts` - Custom error classes
- `src/auth.ts` - Firebase authentication helper
- `src/webhooks.ts` - Webhook signature verification
- `src/index.ts` - Public exports

**Build System:**
- **Bundler:** tsup (TypeScript → ESM + CJS + types)
- **Output:** `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts` (types)

### Building

```bash
cd sdks/javascript
npm install
npm run build
```

Output in `dist/`:
```
dist/
├── index.js        # CommonJS bundle
├── index.mjs       # ES Module bundle
└── index.d.ts      # TypeScript declarations
```

### Testing

```bash
npm test
```

### Publishing to npm

1. **Update version** in `package.json`:
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **Build the package:**
   ```bash
   npm run build
   ```

3. **Login to npm:**
   ```bash
   npm login
   ```

4. **Publish:**
   ```bash
   npm publish --access public
   ```

5. **Tag release on GitHub:**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

### Installation by Users

```bash
npm install @marketplace/sdk
```

### Usage Example

```typescript
import { MarketplaceClient } from '@marketplace/sdk';

const client = new MarketplaceClient({
  baseUrl: 'https://api.example.com/api',
  apiKey: 'ak_live_...'
});

const services = await client.listServices();
```

## PHP SDK

### Architecture

**Location:** `sdks/php/`

**Key Files:**
- `src/MarketplaceClient.php` - Main API client
- `src/Exceptions.php` - Exception classes
- `src/WebhookVerifier.php` - Webhook verification
- `composer.json` - Composer configuration

**Dependencies:**
- `guzzlehttp/guzzle` - HTTP client
- `ext-json` - JSON extension

**PSR Standards:**
- PSR-4 autoloading
- PSR-7 HTTP messages (via Guzzle)

### Testing

```bash
cd sdks/php
composer install
composer test
```

### Publishing to Packagist

1. **Update version** in `composer.json`:
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **Commit and tag:**
   ```bash
   git add composer.json
   git commit -m "Release v1.0.1"
   git tag 1.0.1
   git push origin main --tags
   ```

3. **Packagist auto-updates** from GitHub tags (if webhook configured)

4. **Manual update** (if needed):
   - Visit https://packagist.org/packages/marketplace/sdk
   - Click "Update" button

### Installation by Users

```bash
composer require marketplace/sdk
```

### Usage Example

```php
<?php

require 'vendor/autoload.php';

use Marketplace\SDK\MarketplaceClient;

$client = new MarketplaceClient([
    'baseUrl' => 'https://api.example.com/api',
    'apiKey' => 'ak_live_...'
]);

$services = $client->listServices();
```

## SDK Feature Matrix

| Feature | JavaScript/TypeScript | PHP |
|---------|----------------------|-----|
| API Key Auth | ✅ | ✅ |
| Firebase Auth | ✅ | ⚠️ (token only) |
| Auto Retry | ✅ | ✅ |
| Type Safety | ✅ (TypeScript) | ✅ (PHP 8+ types) |
| Error Handling | ✅ Custom classes | ✅ Custom exceptions |
| Webhook Verify | ✅ | ✅ |
| Services API | ✅ | ✅ |
| Vendors API | ✅ | ✅ |
| Subscriptions | ✅ | ✅ |
| Messages | ✅ | ✅ |
| Wallet | ✅ | ✅ |
| API Keys | ✅ | ✅ |
| Webhooks | ✅ | ✅ |
| Health Check | ✅ | ✅ |
| Version Info | ✅ | ✅ |

## Maintenance

### Adding New Endpoints

When adding new API endpoints, update both SDKs:

#### JavaScript/TypeScript

1. **Add types** to `src/types.ts`:
   ```typescript
   export interface NewResource {
     id: string;
     name: string;
     // ... fields
   }
   ```

2. **Add methods** to `src/client.ts`:
   ```typescript
   async getNewResource(id: string): Promise<NewResource> {
     const { data } = await this.client.get(`/new-resource/${id}`);
     return data;
   }
   ```

3. **Update README** with usage examples

4. **Rebuild and republish**

#### PHP

1. **Add method** to `src/MarketplaceClient.php`:
   ```php
   /**
    * Get new resource
    */
   public function getNewResource(string $id): array
   {
       return $this->request('GET', "/new-resource/{$id}");
   }
   ```

2. **Update README** with usage examples

3. **Tag and publish**

### Versioning Strategy

Follow **Semantic Versioning (semver)**:

- **Major (x.0.0)** - Breaking changes
  - Changed method signatures
  - Removed methods
  - Changed return types

- **Minor (1.x.0)** - New features, backwards compatible
  - New methods
  - New optional parameters
  - New types/interfaces

- **Patch (1.0.x)** - Bug fixes
  - Bug fixes
  - Documentation updates
  - Internal refactoring

### Changelog

Maintain `CHANGELOG.md` in each SDK:

```markdown
# Changelog

## [1.1.0] - 2025-01-15

### Added
- Support for new Analytics API
- `getAnalytics()` method

### Fixed
- Retry logic for network errors

## [1.0.0] - 2025-01-01

### Added
- Initial release
- Full API coverage
```

## CI/CD Automation

### Recommended GitHub Actions

**JavaScript SDK** (`.github/workflows/js-sdk.yml`):

```yaml
name: JavaScript SDK

on:
  push:
    branches: [main]
    paths:
      - 'sdks/javascript/**'
  pull_request:
    paths:
      - 'sdks/javascript/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd sdks/javascript && npm ci
      - run: cd sdks/javascript && npm run build
      - run: cd sdks/javascript && npm test
      - run: cd sdks/javascript && npm run lint
  
  publish:
    needs: test
    if: startsWith(github.ref, 'refs/tags/js-v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: cd sdks/javascript && npm ci
      - run: cd sdks/javascript && npm run build
      - run: cd sdks/javascript && npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**PHP SDK** (`.github/workflows/php-sdk.yml`):

```yaml
name: PHP SDK

on:
  push:
    branches: [main]
    paths:
      - 'sdks/php/**'
  pull_request:
    paths:
      - 'sdks/php/**'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php-version: ['8.0', '8.1', '8.2']
    steps:
      - uses: actions/checkout@v3
      - uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php-version }}
      - run: cd sdks/php && composer install
      - run: cd sdks/php && composer test
      - run: cd sdks/php && composer analyse
```

## Testing Strategy

### Unit Tests

Test individual SDK methods with mocked HTTP responses.

**JavaScript Example:**
```typescript
// __tests__/client.test.ts
import { MarketplaceClient } from '../src/client';
import nock from 'nock';

describe('MarketplaceClient', () => {
  const baseUrl = 'https://api.example.com/api';
  
  it('should list services', async () => {
    nock(baseUrl)
      .get('/data/services')
      .reply(200, {
        page: 1,
        pageSize: 20,
        total: 100,
        items: [{ id: '1', title: 'Test Service' }]
      });
    
    const client = new MarketplaceClient({ baseUrl, apiKey: 'test' });
    const result = await client.listServices();
    
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Test Service');
  });
});
```

**PHP Example:**
```php
<?php

namespace Marketplace\SDK\Tests;

use Marketplace\SDK\MarketplaceClient;
use PHPUnit\Framework\TestCase;

class ClientTest extends TestCase
{
    public function testListServices(): void
    {
        // Mock Guzzle client
        $mock = new MockHandler([
            new Response(200, [], json_encode([
                'page' => 1,
                'pageSize' => 20,
                'total' => 100,
                'items' => [['id' => '1', 'title' => 'Test Service']]
            ]))
        ]);
        
        $client = new MarketplaceClient(['baseUrl' => 'https://api.example.com/api']);
        // Inject mock...
        
        $result = $client->listServices();
        
        $this->assertCount(1, $result['items']);
        $this->assertEquals('Test Service', $result['items'][0]['title']);
    }
}
```

### Integration Tests

Test against real API (staging environment):

```bash
# JavaScript
API_BASE_URL=https://staging-api.example.com/api \
API_KEY=ak_test_... \
npm test:integration

# PHP
API_BASE_URL=https://staging-api.example.com/api \
API_KEY=ak_test_... \
composer test:integration
```

## Documentation

### README Structure

Each SDK README should include:

1. **Installation** - How to install via package manager
2. **Quick Start** - Basic usage example
3. **Authentication** - API key and Firebase auth examples
4. **Core Features** - All major API methods with examples
5. **Error Handling** - Exception handling examples
6. **Configuration** - All config options
7. **Advanced Usage** - Retries, timeouts, dynamic auth
8. **Examples** - Complete integration examples
9. **Support** - Links and contact info

### Code Examples

Provide working examples for common use cases:

- Creating resources
- Listing with filters
- Updating resources
- Error handling
- Webhook verification
- Authentication flows

## Support

### Issue Templates

Create GitHub issue templates:

**Bug Report:**
```markdown
**SDK Version:** 1.0.0
**Language:** JavaScript / PHP
**Environment:** Node 18 / PHP 8.1

**Describe the bug:**
A clear description...

**Code to reproduce:**
```typescript
const client = new MarketplaceClient({...});
// ...
```

**Expected behavior:**
What should happen...

**Actual behavior:**
What actually happens...
```

**Feature Request:**
```markdown
**Is your feature request related to a problem?**
Describe the problem...

**Describe the solution you'd like:**
What you want to happen...

**Additional context:**
Any other context...
```

## Release Checklist

Before releasing a new SDK version:

- [ ] Update version in `package.json` / `composer.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run all tests (`npm test` / `composer test`)
- [ ] Build SDK (`npm run build`)
- [ ] Update README if API changed
- [ ] Commit changes
- [ ] Create git tag (`git tag v1.0.1`)
- [ ] Push tag (`git push origin v1.0.1`)
- [ ] Publish package (`npm publish` / Packagist auto-updates)
- [ ] Create GitHub release with changelog
- [ ] Announce in documentation / blog

## Future SDKs

### Python SDK

```python
from marketplace_sdk import MarketplaceClient

client = MarketplaceClient(
    base_url='https://api.example.com/api',
    api_key='ak_live_...'
)

services = await client.list_services(page=1, page_size=20)
```

**Considerations:**
- Use `httpx` for async HTTP
- Type hints with `typing` module
- Dataclasses for models
- `poetry` for dependency management

### Ruby SDK

```ruby
require 'marketplace_sdk'

client = Marketplace::Client.new(
  base_url: 'https://api.example.com/api',
  api_key: 'ak_live_...'
)

services = client.list_services(page: 1, page_size: 20)
```

**Considerations:**
- Use `faraday` for HTTP
- RSpec for testing
- Bundler for gem management

### Go SDK

```go
import "github.com/marketplace/sdk-go"

client := marketplace.NewClient(&marketplace.Config{
    BaseURL: "https://api.example.com/api",
    APIKey:  "ak_live_...",
})

services, err := client.ListServices(ctx, &marketplace.ListServicesParams{
    Page:     1,
    PageSize: 20,
})
```

**Considerations:**
- Context support
- Error wrapping
- Struct tags for JSON
- Go modules

## Conclusion

The SDK architecture provides:
- ✅ **Type Safety** - Full TypeScript/PHP 8 types
- ✅ **Error Handling** - Custom exception classes
- ✅ **Auto Retry** - Exponential backoff
- ✅ **Webhook Verify** - Signature validation
- ✅ **Complete Coverage** - All 80+ API endpoints
- ✅ **Easy Publishing** - npm/Packagist ready

For questions or contributions, contact the SDK team or open an issue on GitHub.
