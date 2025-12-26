import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { initializeWebSocket } from "./websocket";

// Initialize Firebase Admin
try {
  if (getApps().length === 0) {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Use service account credentials from environment variables
      const serviceAccount = {
        projectId: "roda-bem-turismo",
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      };
      
      initializeApp({
        credential: cert(serviceAccount),
        projectId: "roda-bem-turismo"
      });
    } else {
      // For development without service account - try application default
      try {
        console.log('No service account credentials, trying application default');
        initializeApp({
          credential: applicationDefault(),
          projectId: "roda-bem-turismo"
        });
      } catch (credError) {
        // If no credentials available, just initialize with project ID for development
        initializeApp({
          projectId: "roda-bem-turismo"
        });
      }
    }
  }
  log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
}

const app = express();
// AGGRESSIVE COST CUTTING: Add gzip compression to reduce bandwidth by 70%
app.use(compression({
  level: 9, // Maximum compression
  threshold: 512, // Compress responses > 512 bytes
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: false, limit: '15mb' }));

// Security: Allow iframe embedding and prevent old code from running
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  
  // Force clients to always fetch fresh JavaScript/CSS (prevent old cached code from running)
  // Cover all asset paths including Vite's /assets/... and root-level files
  if (req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.html') || req.path.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // COST CUT: WebSocket disabled - uses too many compute units. Use polling instead.
  // initializeWebSocket(server);
  // log('WebSocket server initialized');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

