/**
 * Este archivo es el punto de entrada para el Server-Side Rendering (SSR)
 * en un entorno de Netlify. A diferencia de una configuración tradicional
 * con Express.js, este utiliza las herramientas específicas de Netlify y Angular
 * para renderizar la aplicación en el servidor.
 */

// Importaciones clave para el SSR de Angular en Netlify.
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { getContext } from '@netlify/angular-runtime/context.mjs';

// Se crea una instancia del motor de renderizado de Angular.
// Este motor es el responsable de tomar una solicitud y generar el HTML correspondiente.
const engine = new AngularAppEngine();

/**
 * El manejador principal de solicitudes para el entorno de Netlify.
 * Esta función asíncrona se ejecutará en el servidor de Netlify por cada petición.
 * @param request El objeto de solicitud entrante (Request).
 * @returns Una promesa que se resuelve con el objeto de respuesta (Response).
 */
export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  // Obtiene el contexto específico de Netlify, necesario para que el motor de Angular funcione correctamente.
  const context = getContext();

  // Ejemplo de cómo podrías crear rutas de API personalizadas en el servidor.
  // Si una solicitud coincide con '/api/hello', se devuelve una respuesta JSON
  // en lugar de renderizar la aplicación Angular.
  // const { pathname } = new URL(request.url);
  // if (pathname === '/api/hello') return Response.json({ msg: 'hi' });

  // Pasa la solicitud al motor de Angular para que la procese y renderice la página.
  const result = await engine.handle(request, context);
  // Si el motor no pudo manejar la ruta (devuelve null), se envía una respuesta 404 "Not Found".
  return result ?? new Response('Not found', { status: 404 });
}

// Se exporta un manejador de solicitudes genérico.
// Este es utilizado por las herramientas del CLI de Angular (como el servidor de desarrollo)
// para simular el comportamiento del SSR durante el desarrollo local.
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);
