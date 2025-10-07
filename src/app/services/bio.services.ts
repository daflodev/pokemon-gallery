// src/app/services/bio.services.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import type { Pokemon } from '../models/pokemon.models';

/**
 * Define la estructura esperada de la respuesta JSON de la Netlify Function.
 */
export interface AIBioResponse {
    ok?: boolean;
    bio?: string;
    message?: string;
}

/**
 * Servicio encargado de comunicarse con la Netlify Function para generar
 * biografías de Pokémon utilizando un modelo de IA (Gemini).
 */
@Injectable({ providedIn: 'root' })
export class BiosService {
    /** Cliente HTTP de Angular para realizar peticiones. Se inyecta usando la función `inject`. */
    private http = inject(HttpClient);
    /** Endpoint de la Netlify Function que genera la biografía. */
    private endpoint = '/.netlify/functions/generate-bios';

    /**
     * Prepara los datos de un Pokémon, los envía a la Netlify Function y devuelve la biografía generada por la IA.
     * @param pokemon El objeto Pokémon del cual se extraerán los datos.
     * @returns Un `Observable` que emite la biografía generada como un `string`.
     */
    createBio(pokemon: Pokemon): Observable<string> {
        const types =
            (pokemon.types ?? [])
                .map((t: any) => t?.type?.name || t?.name)
                .filter(Boolean);

        const abilities =
            (pokemon.abilities ?? [])
                .map((a: any) => a?.ability?.name || a?.name)
                .filter(Boolean);

        // Construye el cuerpo de la solicitud con los datos del Pokémon y los parámetros para la IA.
        const body = {
            name: pokemon.name,
            types,
            abilities,
            language: 'es',
            maxWords: 40,
            model: 'gemini-2.5-flash',
            temperature: 0.7,
        };

        // Realiza la petición POST y transforma la respuesta.
        return this.http.post<AIBioResponse>(this.endpoint, body).pipe(
            // Extrae solo la propiedad 'bio' de la respuesta. Si no existe, devuelve una cadena vacía.
            map((res) => res?.bio ?? '')
        );
    }
}
