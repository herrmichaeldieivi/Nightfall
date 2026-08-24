import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// Aliases are declared here explicitly (mirroring vite.config.ts) because
// middleware-mode instances must not depend on config-file resolution.
const alias = {
  "@": path.resolve(PROJECT_ROOT, "client", "src"),
  "@shared": path.resolve(PROJECT_ROOT, "shared"),
  "@assets": path.resolve(PROJECT_ROOT, "attached_assets"),
};

export async function setupVite(app: express.Express, server: import("http").Server) {
  const vite = await createViteServer({
    root: path.resolve(PROJECT_ROOT, "client"),
    server: { middlewareMode: true },
    appType: "spa",
    resolve: { alias },
  });
  app.use(vite.middlewares);
}

export function serveStatic(app: express.Express) {
  const distPath = path.resolve(PROJECT_ROOT, "dist", "public");
  app.use(express.static(distPath));
  app.get("*", (req: express.Request, res: express.Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
