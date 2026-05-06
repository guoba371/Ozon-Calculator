import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const port = 4173;
const publicRoots = [join(root, "web"), join(root, "shared")];
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const decoded = decodeURIComponent(url.pathname);
  const safePath = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(root, safePath);
  const isPublicFile = publicRoots.some((publicRoot) => {
    return filePath === publicRoot || filePath.startsWith(publicRoot + sep);
  });

  if (url.pathname === "/") {
    res.statusCode = 302;
    res.setHeader("Location", "/web/index.html");
    res.end();
    return;
  }

  if (!filePath.startsWith(root) || !isPublicFile || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
    return;
  }

  res.setHeader("Content-Type", types[extname(filePath)] ?? "application/octet-stream");
  createReadStream(filePath).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log(`http://localhost:${port}/`);
});
