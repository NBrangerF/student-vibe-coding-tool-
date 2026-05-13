"use client";

import { useEffect, useMemo } from "react";

interface P5PreviewProps {
  code: string;
  runKey: number;
  onConsole: (line: string) => void;
  onError: (message: string) => void;
}

function escapeScript(code: string): string {
  return code.replace(/<\/script/gi, "<\\/script");
}

export function P5Preview({ code, runKey, onConsole, onError }: P5PreviewProps) {
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data as { source?: string; type?: string; message?: string };
      if (data?.source !== "p5-preview") return;

      if (data.type === "console" && data.message) {
        onConsole(data.message);
      }
      if (data.type === "error" && data.message) {
        onError(data.message);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConsole, onError]);

  const srcDoc = useMemo(() => {
    const safeCode = escapeScript(code);
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none';"
    />
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: #f6f8f4;
        color: #252a2f;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        display: grid;
        width: 100%;
        height: 100%;
        place-items: center;
      }

      canvas {
        max-width: min(100%, 900px);
        max-height: 100%;
        border-radius: 6px;
        box-shadow: 0 22px 70px rgba(22, 31, 38, 0.12);
      }

      .loading {
        color: #657078;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <main id="preview-root"><span class="loading">Getting preview ready...</span></main>
    <script>
      window.__sendToParent = function(type, message) {
        parent.postMessage({ source: 'p5-preview', type: type, message: String(message || '') }, '*');
      };

      function removeLoadingIfCanvasExists() {
        if (!document.querySelector('canvas')) return;
        document.querySelector('.loading')?.remove();
      }

      const loadingObserver = new MutationObserver(removeLoadingIfCanvasExists);
      loadingObserver.observe(document.body, { childList: true, subtree: true });

      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = function() {
        window.__sendToParent('console', Array.from(arguments).join(' '));
        originalLog.apply(console, arguments);
      };
      console.warn = function() {
        window.__sendToParent('console', 'Warning: ' + Array.from(arguments).join(' '));
        originalWarn.apply(console, arguments);
      };
      console.error = function() {
        window.__sendToParent('error', Array.from(arguments).join(' '));
        originalError.apply(console, arguments);
      };

      window.onerror = function(message, source, lineno, colno) {
        window.__sendToParent('error', message + ' at line ' + lineno + ':' + colno);
      };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/p5@1.11.1/lib/p5.min.js"></script>
    <script>
      try {
        ${safeCode}
        removeLoadingIfCanvasExists();
        window.__sendToParent('console', 'Sketch loaded.');
      } catch (error) {
        window.__sendToParent('error', error && error.message ? error.message : error);
      }
    </script>
  </body>
</html>`;
  }, [code, runKey]);

  return (
    <iframe
      key={runKey}
      title="p5 live preview"
      className="preview-frame"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
    />
  );
}
