import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Encabezados para manejar Cross-Origin Resource Sharing (CORS).
 * Permiten que tu aplicación web (ej. https://pokemon-gallery.netlify.app)
 * pueda hacer peticiones a esta función (que se ejecuta en un dominio de Netlify).
 */
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Permite cualquier origen. Para producción, es mejor limitarlo a tu dominio.
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * El manejador principal de la función serverless de Netlify.
 * Se ejecuta cada vez que se recibe una petición en el endpoint de esta función.
 */
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    // 1. Manejo de la petición "pre-vuelo" (preflight) de CORS.
    // El navegador envía una petición OPTIONS antes de la POST para verificar los permisos.
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204, // "No Content" - Indica que la petición es aceptada.
            headers: corsHeaders, // Devuelve los encabezados CORS para confirmar.
        };
    }

    // Solo permitir peticiones POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        // 3. Validar que la petición contenga un cuerpo (body).
        if (!event.body) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Missing body' })
            };
        }

        // 4. Parsear el cuerpo JSON y extraer los datos del Pokémon.
        const body = JSON.parse(event.body);
        const { name, types = [], abilities = [] } = body as {
            name?: string;
            types?: string[];
            abilities?: string[];
        };

        // 5. Validar que el nombre del Pokémon fue proporcionado.
        if (!name) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Missing name' })
            };
        }

        // 6. Obtener la clave de la API de las variables de entorno de Netlify (¡nunca en el código!).
        const apiKey = process.env['GEMINI_API_KEY'];
        if (!apiKey) {
            console.error('Error: La variable de entorno GEMINI_API_KEY no está configurada.');
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Error de configuración del servidor' })
            };
        }

        // 7. Inicializar el cliente de la IA de Google.
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // 8. Construir el "prompt": la instrucción precisa para la IA.
        const prompt =
            `Genera una biografía creativa y corta para un Pokémon llamado ${name}. ` +
            `Es de tipo ${types.join(' y ')}. Sus habilidades son ${abilities.join(', ')}. ` +
            `La biografía debe tener un máximo de 40 palabras y no debe repetir los tipos ni las habilidades en la descripción.`;

        // 9. Enviar el prompt a la IA y esperar la respuesta.
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // 10. Devolver una respuesta exitosa con la biografía generada.
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ bio: text }),
        };

    } catch (e: any) {
        // 11. Manejo de errores. Si algo falla, se registra en los logs de Netlify y se devuelve un error 500.
        console.error('Error al generar la biografía:', e.message);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Error al generar la biografía del Pokémon' }),
        };
    }
};

export { handler };
