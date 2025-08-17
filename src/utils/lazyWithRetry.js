// src/utils/lazyWithRetry.js
import React from "react";
export const lazyWithRetry = (factory, retries = 2, delay = 800) => {
  return React.lazy(async () => {
    let lastErr;
    for (let i = 0; i <= retries; i++) {
      try { return await factory(); }
      catch (e) { lastErr = e; if (i < retries) await new Promise(r => setTimeout(r, delay)); }
    }
    throw lastErr;
  });
};
