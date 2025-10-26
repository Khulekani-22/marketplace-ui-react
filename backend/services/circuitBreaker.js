// backend/services/circuitBreaker.js
import EventEmitter from 'events';

/**
 * Circuit Breaker States
 */
const CircuitState = {
  CLOSED: 'CLOSED',     // Normal operation - requests pass through
  OPEN: 'OPEN',         // Circuit tripped - fail fast
  HALF_OPEN: 'HALF_OPEN' // Testing if service recovered
};

/**
 * Circuit Breaker Implementation
 * Prevents cascade failures by failing fast when service is down
 */
class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.name = options.name || 'circuit-breaker';
    this.failureThreshold = options.failureThreshold || 5; // Failures before opening
    this.failureRate = options.failureRate || 0.5; // 50% failure rate
    this.successThreshold = options.successThreshold || 2; // Successes to close from half-open
    this.timeout = options.timeout || 60000; // Time to wait before half-open (60s)
    this.resetTimeout = options.resetTimeout || 30000; // Time in half-open before reset (30s)
    this.volumeThreshold = options.volumeThreshold || 10; // Minimum requests before calculating rate

    // State
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.requestCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.stats = {
      totalRequests: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      totalRejections: 0,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute(fn, fallback = null) {
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has passed to try half-open
      if (Date.now() >= this.nextAttemptTime) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        this.emit('half-open', { name: this.name });
        console.log(`[CircuitBreaker:${this.name}] State: HALF_OPEN`);
      } else {
        // Circuit is open - fail fast
        this.stats.totalRejections++;
        this.emit('reject', { name: this.name, state: this.state });
        
        if (fallback) {
          return fallback();
        }
        
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      if (fallback) {
        return fallback(error);
      }
      
      throw error;
    }
  }

  /**
   * Handle successful request
   */
  onSuccess() {
    this.stats.totalRequests++;
    this.stats.totalSuccesses++;
    this.requestCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      // Close circuit if success threshold reached
      if (this.successCount >= this.successThreshold) {
        this.close();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = 0;
    }

    this.emit('success', { 
      name: this.name, 
      state: this.state,
      stats: this.getStats() 
    });
  }

  /**
   * Handle failed request
   */
  onFailure() {
    this.stats.totalRequests++;
    this.stats.totalFailures++;
    this.requestCount++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    this.emit('failure', { 
      name: this.name, 
      state: this.state,
      failureCount: this.failureCount,
      stats: this.getStats() 
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately reopen on failure in half-open
      this.open();
    } else if (this.state === CircuitState.CLOSED) {
      // Check if should open circuit
      if (this.shouldOpen()) {
        this.open();
      }
    }
  }

  /**
   * Check if circuit should open
   */
  shouldOpen() {
    // Need minimum volume of requests
    if (this.requestCount < this.volumeThreshold) {
      return false;
    }

    // Check failure threshold
    if (this.failureCount >= this.failureThreshold) {
      return true;
    }

    // Check failure rate
    const currentFailureRate = this.failureCount / this.requestCount;
    return currentFailureRate >= this.failureRate;
  }

  /**
   * Open the circuit
   */
  open() {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.timeout;
    
    this.emit('open', { 
      name: this.name,
      failureCount: this.failureCount,
      requestCount: this.requestCount,
      nextAttemptTime: this.nextAttemptTime,
      stats: this.getStats() 
    });
    
    console.error(`[CircuitBreaker:${this.name}] State: OPEN - Failing fast for ${this.timeout}ms`);
  }

  /**
   * Close the circuit
   */
  close() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.requestCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    
    this.emit('close', { 
      name: this.name,
      stats: this.getStats() 
    });
    
    console.log(`[CircuitBreaker:${this.name}] State: CLOSED - Normal operation`);
  }

  /**
   * Manually trip the circuit
   */
  trip() {
    this.failureCount = this.failureThreshold;
    this.open();
  }

  /**
   * Manually reset the circuit
   */
  reset() {
    this.close();
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Check if circuit is open
   */
  isOpen() {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Get circuit statistics
   */
  getStats() {
    const totalRequests = this.stats.totalRequests || 1; // Avoid division by zero
    
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      stats: {
        totalRequests: this.stats.totalRequests,
        totalSuccesses: this.stats.totalSuccesses,
        totalFailures: this.stats.totalFailures,
        totalRejections: this.stats.totalRejections,
        successRate: ((this.stats.totalSuccesses / totalRequests) * 100).toFixed(2) + '%',
        failureRate: ((this.stats.totalFailures / totalRequests) * 100).toFixed(2) + '%',
        rejectionRate: ((this.stats.totalRejections / totalRequests) * 100).toFixed(2) + '%',
      }
    };
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different services
 */
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Create or get circuit breaker for a service
   */
  getBreaker(name, options = {}) {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker({ ...options, name });
      this.breakers.set(name, breaker);
      
      // Log state changes
      breaker.on('open', data => {
        console.error(`[CircuitBreakerManager] ${data.name} opened`);
      });
      
      breaker.on('half-open', data => {
        console.warn(`[CircuitBreakerManager] ${data.name} half-open`);
      });
      
      breaker.on('close', data => {
        console.log(`[CircuitBreakerManager] ${data.name} closed`);
      });
    }
    
    return this.breakers.get(name);
  }

  /**
   * Execute function with circuit breaker
   */
  async execute(name, fn, fallback = null, options = {}) {
    const breaker = this.getBreaker(name, options);
    return breaker.execute(fn, fallback);
  }

  /**
   * Get all breaker states
   */
  getAllStates() {
    const states = {};
    
    for (const [name, breaker] of this.breakers) {
      states[name] = breaker.getStats();
    }
    
    return states;
  }

  /**
   * Reset all breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Get breaker count
   */
  count() {
    return this.breakers.size;
  }
}

// Singleton instance
const circuitBreakerManager = new CircuitBreakerManager();

// Convenience functions
export function createCircuitBreaker(name, options = {}) {
  return circuitBreakerManager.getBreaker(name, options);
}

export function executeWithBreaker(name, fn, fallback = null, options = {}) {
  return circuitBreakerManager.execute(name, fn, fallback, options);
}

export function getAllBreakerStates() {
  return circuitBreakerManager.getAllStates();
}

export function resetAllBreakers() {
  return circuitBreakerManager.resetAll();
}

export {
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitState,
  circuitBreakerManager as default,
};
