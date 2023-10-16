// run this file: `deno run --allow-read --allow-net canvas-capture-deno.js`

// a file server that serves files with custom headers that allow
// the `canvas-capture` lib to record and save mp4 video captures of canvas.
// ref: https://github.com/amandaghassaei/canvas-capture#caveats
// ref: https://deno.land/x/static_files@1.1.6

// @ts-nocheck
import { serve } from "https://deno.land/std@0.116.0/http/server.ts";
import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts";

function setHeaders(headers: Headers, path: string, stats?: Deno.FileInfo) {
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
}
const serveFiles = (req: Request) =>
  staticFiles(".", { setHeaders })({
    request: req,
    respondWith: (r: Response) => r,
  });

serve((req) => serveFiles(req), { addr: ":3000" });
