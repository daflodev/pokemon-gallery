/**
 * Representa un Pokémon individual con todos sus detalles de combate y apariencia.
 * Corresponde a la respuesta del endpoint /pokemon/{name}.
 */
export interface Pokemon {
    id: number;
    name: string;
    height: number;
    weight: number;
    sprites: PokemonSprites;
    types: PokemonType[];
    abilities: PokemonAbility[];
    stats: PokemonStat[];
}

/**
 * Representa la respuesta de la API para una especie de Pokémon.
 * Contiene información sobre la evolución, textos de la Pokédex y más.
 */
export interface PokemonSpecies {
    id: number;
    name: string;
    order: number;
    gender_rate: number;
    capture_rate: number;
    base_happiness: number;
    is_baby: boolean;
    is_legendary: boolean;
    is_mythical: boolean;
    hatch_counter: number;
    has_gender_differences: boolean;

    // La propiedad clave para encontrar la cadena de evolución.
    evolution_chain: {
        url: string;
    };

    // Contiene las descripciones de la Pokédex en varios idiomas.
    flavor_text_entries: {
        flavor_text: string;
        language: {
            name: string;
            url: string;
        };
        version: {
            name: string;
            url: string;
        };
    }[];

    // Contiene la categoría del Pokémon (ej. "Pokémon Semilla") en varios idiomas.
    genera: {
        genus: string;
        language: {
            name: string;
            url: string;
        };
    }[];

    color: {
        name: string;
        url: string;
    };

    shape: {
        name: string;
        url: string;
    } | null;

    evolves_from_species: {
        name: string;
        url: string;
    } | null;

    habitat: {
        name: string;
        url: string;
    } | null;
}


// --- Interfaces auxiliares para el modelo Pokemon ---

export interface PokemonType {
    slot: number;
    type: {
        name: string;
        url: string;
    };
}

export interface PokemonAbility {
    is_hidden: boolean;
    slot: number;
    ability: {
        name: string;
        url: string;
    };
}

export interface PokemonStat {
    base_stat: number;
    effort: number;
    stat: {
        name: string;
        url: string;
    };
}

export interface PokemonSprites {
    front_default: string | null;
    front_shiny: string | null;
    other?: {
        'official-artwork': {
            front_default: string | null;
        };
        'home': {
            front_default: string | null;
        };
        'dream_world': {
            front_default: string | null;
        }
    };
}