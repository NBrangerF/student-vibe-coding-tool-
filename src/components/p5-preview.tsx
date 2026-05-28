import { useEffect, useMemo, useRef } from "react";

interface P5PreviewProps {
  code: string;
  runKey: number;
  onConsole?: (line: string) => void;
  onError?: (message: string) => void;
}

function previewDocument(code: string) {
  const safeCode = code.replace(/<\/script/giu, "<\\/script");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #eef7ff; }
      canvas { display: block; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js"></script>
  </head>
  <body>
    <script>
      const parentLog = (type, value) => window.parent.postMessage({ source: "p5-preview", type, value: String(value) }, "*");
      for (const method of ["log", "warn", "error"]) {
        const original = console[method].bind(console);
        console[method] = (...args) => {
          parentLog(method, args.join(" "));
          original(...args);
        };
      }
      window.onerror = (message) => parentLog("runtime-error", message);
      try {
        ${safeCode}
      } catch (error) {
        parentLog("runtime-error", error && error.message ? error.message : error);
      }
    </script>
  </body>
</html>`;
}

export function P5Preview({ code, runKey, onConsole, onError }: P5PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const srcDoc = useMemo(() => previewDocument(code), [code, runKey]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.source !== "p5-preview") return;
      if (event.data.type === "runtime-error") {
        onError?.(String(event.data.value));
        return;
      }
      onConsole?.(`[${event.data.type}] ${event.data.value}`);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConsole, onError]);

  return (
    <iframe
      ref={iframeRef}
      title="Live p5 preview"
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="preview-frame"
    />
  );
}
