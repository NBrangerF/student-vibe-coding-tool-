import { createServer, request as httpRequest } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, normalize, relative, resolve } from "node:path";
import { transform } from "esbuild";

const ROOT = process.cwd();
const SRC_ROOT = resolve(ROOT, "src");
const PORT = Number(process.env.PREVIEW_PORT ?? 5174);
const API_PORT = Number(process.env.API_PORT ?? 8787);

const bareImports = new Map([
  ["react", "https://esm.sh/react@18.3.1"],
  ["react-dom/client", "https://esm.sh/react-dom@18.3.1/client"],
  ["react/jsx-runtime", "https://esm.sh/react@18.3.1/jsx-runtime"],
  ["lucide-react", "https://esm.sh/lucide-react@0.468.0?deps=react@18.3.1"]
]);

function send(response, status, body, contentType) {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function isInside(parent, child) {
  const rel = relative(parent, child);
  return rel && !rel.startsWith("..") && !rel.startsWith("/");
}

function resolveSourcePath(urlPath) {
  const cleanPath = normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const absolute = resolve(ROOT, `.${cleanPath}`);
  if (!isInside(SRC_ROOT, absolute) && absolute !== SRC_ROOT) return null;
  return absolute;
}

function withKnownExtension(pathWithoutExtension) {
  if (existsSync(pathWithoutExtension)) return pathWithoutExtension;
  for (const ext of [".tsx", ".ts", ".jsx", ".js", ".css"]) {
    const candidate = `${pathWithoutExtension}${ext}`;
    if (existsSync(candidate)) return candidate;
  }
  return pathWithoutExtension;
}

function moduleUrlForPath(filePath) {
  return `/${relative(ROOT, filePath).replace(/\\/gu, "/")}`;
}

function resolveImport(specifier, importerPath) {
  if (bareImports.has(specifier)) return bareImports.get(specifier);
  if (/^https?:\/\//u.test(specifier)) return specifier;

  let resolvedPath = null;
  if (specifier.startsWith("@/")) {
    resolvedPath = withKnownExtension(resolve(SRC_ROOT, specifier.slice(2)));
  } else if (specifier.startsWith(".")) {
    resolvedPath = withKnownExtension(resolve(importerPath, "..", specifier));
  } else if (specifier.startsWith("/src/")) {
    resolvedPath = withKnownExtension(resolve(ROOT, `.${specifier}`));
  }

  if (!resolvedPath) return specifier;
  if (extname(resolvedPath) === ".css") {
    return `/__css?path=${encodeURIComponent(moduleUrlForPath(resolvedPath))}`;
  }
  return moduleUrlForPath(resolvedPath);
}

function rewriteImports(source, importerPath) {
  return source
    .replace(/from\s+["']([^"']+)["']/gu, (_match, specifier) => `from "${resolveImport(specifier, importerPath)}"`)
    .replace(/import\s+["']([^"']+\.css)["'];?/gu, (_match, specifier) => `import "${resolveImport(specifier, importerPath)}";`);
}

async function serveModule(request, response, filePath) {
  const source = readFileSync(filePath, "utf8");
  const rewritten = rewriteImports(source, filePath);
  const loader = extname(filePath).replace(".", "") || "ts";
  const result = await transform(rewritten, {
    loader: loader === "tsx" || loader === "jsx" || loader === "ts" ? loader : "js",
    format: "esm",
    jsx: "automatic",
    target: "es2020",
    sourcemap: "inline"
  });
  const code = result.code
    .replace(/from\s+["']react\/jsx-runtime["']/gu, `from "${bareImports.get("react/jsx-runtime")}"`)
    .replace(/from\s+["']react["']/gu, `from "${bareImports.get("react")}"`);
  send(response, 200, code, "text/javascript; charset=utf-8");
}

function serveCssModule(response, url) {
  const path = url.searchParams.get("path");
  if (!path) {
    send(response, 400, "Missing CSS path", "text/plain; charset=utf-8");
    return;
  }
  const filePath = resolveSourcePath(path);
  if (!filePath || !existsSync(filePath)) {
    send(response, 404, "CSS not found", "text/plain; charset=utf-8");
    return;
  }
  const css = readFileSync(filePath, "utf8");
  const js = `
const style = document.createElement("style");
style.textContent = ${JSON.stringify(css)};
document.head.appendChild(style);
export default style;
`.trim();
  send(response, 200, js, "text/javascript; charset=utf-8");
}

function proxyApi(request, response) {
  const proxy = httpRequest(
    {
      hostname: "localhost",
      port: API_PORT,
      path: request.url,
      method: request.method,
      headers: request.headers
    },
    (apiResponse) => {
      response.writeHead(apiResponse.statusCode ?? 500, apiResponse.headers);
      apiResponse.pipe(response);
    }
  );
  proxy.on("error", (error) => {
    send(response, 502, JSON.stringify({ error: error.message }), "application/json; charset=utf-8");
  });
  request.pipe(proxy);
}

function indexHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Student AI Build Companion</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      proxyApi(request, response);
      return;
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      send(response, 200, indexHtml(), "text/html; charset=utf-8");
      return;
    }
    if (url.pathname === "/__css") {
      serveCssModule(response, url);
      return;
    }
    if (url.pathname.startsWith("/src/")) {
      const filePath = resolveSourcePath(url.pathname);
      if (!filePath || !existsSync(filePath)) {
        send(response, 404, "Module not found", "text/plain; charset=utf-8");
        return;
      }
      await serveModule(request, response, filePath);
      return;
    }
    send(response, 404, "Not found", "text/plain; charset=utf-8");
  } catch (error) {
    send(response, 500, error.stack || error.message, "text/plain; charset=utf-8");
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Local preview listening on http://localhost:${PORT}`);
  console.log(`Proxying /api to http://localhost:${API_PORT}`);
});
