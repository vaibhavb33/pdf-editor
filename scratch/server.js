const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PORT = 4321;
const OUT_DIR = path.resolve(__dirname, "../out");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/") reqPath = "/index.html";

  let filePath = path.join(OUT_DIR, reqPath);

  // Check if file exists directly
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(req, res, filePath, 200);
  }

  // Check if filePath + ".html" exists
  if (fs.existsSync(filePath + ".html") && fs.statSync(filePath + ".html").isFile()) {
    return serveFile(req, res, filePath + ".html", 200);
  }

  // Check if filePath/index.html exists
  const indexPath = path.join(filePath, "index.html");
  if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
    return serveFile(req, res, indexPath, 200);
  }

  // 404 fallback
  const notFoundPath = path.join(OUT_DIR, "404.html");
  if (fs.existsSync(notFoundPath)) {
    return serveFile(req, res, notFoundPath, 404);
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

function serveFile(req, res, filePath, statusCode) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const acceptEncoding = req.headers["accept-encoding"] || "";

  const isCompressible = [".html", ".css", ".js", ".mjs", ".json", ".xml", ".svg", ".txt"].includes(
    ext
  );

  const headers = {
    "Content-Type": contentType,
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  };

  if (isCompressible && acceptEncoding.includes("gzip")) {
    headers["Content-Encoding"] = "gzip";
    res.writeHead(statusCode, headers);
    fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
  } else {
    const stat = fs.statSync(filePath);
    headers["Content-Length"] = stat.size;
    res.writeHead(statusCode, headers);
    fs.createReadStream(filePath).pipe(res);
  }
}

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Server listening with gzip on http://127.0.0.1:${PORT}`);
});
