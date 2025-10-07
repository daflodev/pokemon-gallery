// src/app/services/bio.services.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import type { Pokemon } from '../models/pokemon.models';

export interface AIBioResponse {
    ok?: boolean;
    bio?: string;
    message?: string;
}

@Injectable({ providedIn: 'root' })
export class BiosService {
    private http = inject(HttpClient);
    private endpoint = '/.netlify/functions/generate-bios';

    /**
     * Envía los datos del Pokémon a la Netlify Function y devuelve la bio como string.
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

        const body = {
            name: pokemon.name,
            types,
            abilities,
            language: 'es',
            maxWords: 40,
            model: 'gemini-2.5-flash',
            temperature: 0.7,
        };

        return this.http.post<AIBioResponse>(this.endpoint, body).pipe(
            map((res) => res?.bio ?? '')
        );
    }
}
