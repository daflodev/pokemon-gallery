import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Encabezados CORS consistentes para todas las respuestas ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // O tu dominio específico
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// --- Handler principal de Netlify ---
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    // Manejo de la petición pre-vuelo (preflight) de CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: corsHeaders,
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
        if (!event.body) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Missing body' })
            };
        }

        const body = JSON.parse(event.body);
        const { name, types = [], abilities = [] } = body as {
            name?: string;
            types?: string[];
            abilities?: string[];
        };

        if (!name) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Missing name' })
            };
        }

        const apiKey = process.env['GEMINI_API_KEY'];
        if (!apiKey) {
            console.error('Error: La variable de entorno GEMINI_API_KEY no está configurada.');
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Error de configuración del servidor' })
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt =
            `Genera una biografía creativa y corta para un Pokémon llamado ${name}. ` +
            `Es de tipo ${types.join(' y ')}. Sus habilidades son ${abilities.join(', ')}. ` +
            `La biografía debe tener un máximo de 40 palabras y no debe repetir los tipos ni las habilidades en la descripción.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ bio: text }),
        };

    } catch (e: any) {
        console.error('Error al generar la biografía:', e.message);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Error al generar la biografía del Pokémon' }),
        };
    }
};

export { handler };

