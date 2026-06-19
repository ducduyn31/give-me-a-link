#!/usr/bin/env bun
import { watch } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outdir = resolve(root, 'dist/dev');
const encoder = new TextEncoder();

// SSE clients waiting for reload signals.
const clients = new Set<ReadableStreamDefaultController>();

function notifyReload(): void {
  for (const ctrl of clients) {
    try {
      ctrl.enqueue(encoder.encode('data: reload\n\n'));
    } catch {
      clients.delete(ctrl);
    }
  }
}

const DEV_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>URL → Markdown Link — Options</title>
    <link rel="stylesheet" href="/options.css" />
  </head>
  <body>
    <h1>URL → Markdown Link</h1>
    <main id="root"></main>
    <script src="/chrome-mock.js"></script>
    <script src="/options.js"></script>
    <script>
      const es = new EventSource('/sse');
      es.onmessage = () => location.reload();
    </script>
  </body>
</html>`;

async function buildCss(): Promise<void> {
  const proc = Bun.spawnSync(
    [
      resolve(root, 'node_modules/.bin/tailwindcss'),
      '-i',
      resolve(root, 'src/settings/options.css'),
      '-o',
      resolve(outdir, 'options.css'),
    ],
    { cwd: root },
  );
  if (proc.exitCode !== 0) {
    console.error('[dev] css error:', new TextDecoder().decode(proc.stderr));
  } else {
    console.log('[dev] css rebuilt');
  }
}

async function build(): Promise<void> {
  const result = await Bun.build({
    entrypoints: [
      resolve(root, 'src/dev/chrome-mock.ts'),
      resolve(root, 'src/settings/options.tsx'),
    ],
    outdir,
    format: 'iife',
    target: 'browser',
    naming: { entry: '[name].[ext]' },
    // @ts-expect-error alias is supported at runtime but missing from @types/bun
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
  } else {
    console.log('[dev] rebuilt');
    notifyReload();
  }
}

await Promise.all([build(), buildCss()]);

let debounce: ReturnType<typeof setTimeout> | undefined;
watch(resolve(root, 'src'), { recursive: true }, () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => Promise.all([build(), buildCss()]).catch(console.error), 100);
});

Bun.serve({
  port: 3000,
  idleTimeout: 0,
  async fetch(req) {
    const { pathname } = new URL(req.url);

    if (pathname === '/' || pathname === '/index.html') {
      return new Response(DEV_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (pathname === '/sse') {
      let ctrl!: ReadableStreamDefaultController;
      const stream = new ReadableStream({
        start(c) {
          ctrl = c;
          clients.add(c);
        },
        cancel() {
          clients.delete(ctrl);
        },
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const builtFile = Bun.file(resolve(outdir, pathname.slice(1)));
    if (await builtFile.exists()) return new Response(builtFile);

    const assetFile = Bun.file(resolve(root, 'assets', pathname.slice(1)));
    if (await assetFile.exists()) return new Response(assetFile);

    return new Response('Not found', { status: 404 });
  },
});

console.log('[dev] http://localhost:3000');
