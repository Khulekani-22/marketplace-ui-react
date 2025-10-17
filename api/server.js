// api/server.js
// Thin Vercel serverless entry point that reuses the Express app from backend/server.js

let cachedApp;
let backendModulePromise;

async function loadBackendApp() {
  if (cachedApp) return cachedApp;
  if (!backendModulePromise) {
    backendModulePromise = import("../backend/server.js");
  }
  const mod = await backendModulePromise;
  if (typeof mod.ensureBackendReady === "function") {
    await mod.ensureBackendReady();
  }
  const app = mod.default || mod.app;
  if (!app) {
    throw new Error("backend/server.js did not export an Express app");
  }
  cachedApp = app;
  return app;
}


module.exports = async function handler(req, res) {
  try {
    const app = await loadBackendApp();
    return app(req, res);
  } catch (error) {
    console.error("[Vercel Serverless Handler] Crash:", error);
    res.status(500).json({
      error: "Serverless handler crashed",
      message: error.message,
      stack: error.stack,
    });
  }
};

module.exports.getApp = loadBackendApp;

module.exports.config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
