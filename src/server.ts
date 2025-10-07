// server.ts (Netlify Edge, no Express)
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { getContext } from '@netlify/angular-runtime/context.mjs';

const engine = new AngularAppEngine();

export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  const context = getContext();

  // Optional API routes before SSR:
  // const { pathname } = new URL(request.url);
  // if (pathname === '/api/hello') return Response.json({ msg: 'hi' });

  const result = await engine.handle(request, context);
  return result ?? new Response('Not found', { status: 404 });
}

// Used by Angular CLI (dev-server/build)
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);
