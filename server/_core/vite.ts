import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupVite(app: express.Express, server: import("http").Server) {
  const vite = await createViteServer({
    root: path.resolve(__dirname, "../../client"),
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

export function serveStatic(app: express.Express) {
  const distPath = path.resolve(__dirname, "../../dist/public");
  app.use(express.static(distPath));
  app.get("*", (req: express.Request, res: express.Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
