// src/utils/lazyWithRetry.ts
import React, { ComponentType } from "react";

export const lazyWithRetry = (
  factory: () => Promise<{ default: ComponentType<any> }>, 
  retries = 3, 
  delay = 1000
) => {
  return React.lazy(async () => {
    let lastErr: any;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await factory();
      } catch (error: any) {
        lastErr = error;
        
        // If it's a network error or chunk load error, retry
        if (i < retries && (
          error.name === 'ChunkLoadError' || 
          error.message?.includes('Loading chunk') ||
          error.message?.includes('Loading CSS chunk') ||
          error.message?.includes('dynamically imported module') ||
          error.code === 'MODULE_NOT_FOUND'
        )) {
          console.warn(`Lazy load attempt ${i + 1} failed, retrying in ${delay}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // Exponential backoff
          
          // Clear any cached modules on chunk errors
          if (typeof window !== 'undefined' && window.location) {
            // Force a hard reload on final retry for chunk errors
            if (i === retries - 1 && error.name === 'ChunkLoadError') {
              console.error('Chunk load failed after retries, forcing reload...');
              window.location.reload();
              return; // This line won't be reached, but for clarity
            }
          }
        } else {
          // Non-retryable error, throw immediately
          break;
        }
      }
    }
    
    console.error('Lazy loading failed after all retries:', lastErr);
    throw lastErr;
  });
};
