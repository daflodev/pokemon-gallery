import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Pokemon, PokemonSpecies } from '../models/pokemon.models';



/**
 * @internal
 * Interfaz que representa la estructura de la respuesta de la API para una lista de Pokémon.
 */
interface PokemonListResponse {
  results: { name: string; url: string }[];
}

/**
 * Define la estructura de los datos de una evolución para ser mostrada en la UI.
 * Contiene solo la información esencial requerida por el componente.
 */
export interface EvolutionDetail {
  name: string;
  imageUrl: string;
  types: { type: { name: string } }[];
}

/**
 * Servicio encargado de gestionar todas las interacciones con la PokeAPI.
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private baseUrl = 'https://pokeapi.co/api/v2';
  private POKEMON_LIMIT = 1025;

  /**
   * @param http Cliente HTTP de Angular para realizar peticiones a la API.
   */
  constructor(private http: HttpClient) { }

  /**
   * Obtiene los detalles completos de un Pokémon específico por su nombre.
   * @param name El nombre del Pokémon a buscar.
   * @returns Un Observable que emite los datos completos del Pokémon.
   */
  getPokemonDetails(name: string): Observable<Pokemon> {
    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${name.toLowerCase()}`);
  }

  /**
   * Obtiene una lista de Pokémon seleccionados al azar.
   * @param count El número de Pokémon aleatorios a devolver. Por defecto es 30.
   * @returns Un Observable que emite un array de objetos Pokemon con sus detalles.
   */
  getRandomPokemons(count: number = 30): Observable<Pokemon[]> {
    return this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon?limit=${this.POKEMON_LIMIT}`).pipe(
      switchMap(response => {
        const shuffled = response.results.sort(() => 0.5 - Math.random());
        const selectedPokemons = shuffled.slice(0, count);
        const pokemonDetailRequests = selectedPokemons.map(pokemon =>
          this.http.get<Pokemon>(pokemon.url)
        );
        return forkJoin(pokemonDetailRequests);
      })
    );
  }


  /**
   * Obtiene la cadena de evolución de un Pokémon.
   * Realiza múltiples llamadas a la API para construir un array con los detalles de cada evolución.
   * @param pokemonName El nombre del Pokémon para el cual se busca la cadena de evolución.
   * @returns Un Observable que emite un array de `EvolutionDetail`, cada uno representando un Pokémon en la cadena.
   */
  getPokemonEvolutions(pokemonName: string): Observable<EvolutionDetail[]> {
    return this.http.get<PokemonSpecies>(`${this.baseUrl}/pokemon-species/${pokemonName}`).pipe(
      switchMap(species => {
        if (!species.evolution_chain?.url) { // Si no hay cadena de evolución, se devuelve un array vacío.
          return of([]);
        }
        return this.http.get<any>(species.evolution_chain.url);
      }),
      switchMap(evolutionData => {
        const evolutionNames = this.parseEvolutionChainForNames(evolutionData.chain);
        if (evolutionNames.length === 0) {
          return of([]);
        }
        // Una vez con los nombres, pedimos los detalles de todos los Pokémon en paralelo.
        const detailRequests = evolutionNames.map(name => this.getPokemonDetails(name));
        return forkJoin(detailRequests);
      }),
      map(pokemonDetailsArray => {
        // Mapea el array de Pokémon completos a un formato más simple (EvolutionDetail) para la UI.
        return pokemonDetailsArray.map(pokemon => ({
          name: pokemon.name,
          imageUrl: pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || '',
          types: pokemon.types
        }));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Parsea de forma recursiva el objeto de la cadena de evolución para extraer los nombres de los Pokémon.
   * @param chain El objeto `chain` de la respuesta de la API de evoluciones.
   * @returns Un array de strings con los nombres de los Pokémon en orden de evolución.
   */
  private parseEvolutionChainForNames(chain: any): string[] {
    const names: string[] = [];
    let currentEvolution = chain;

    // Recorre la cadena mientras exista una siguiente evolución.
    do {
      names.push(currentEvolution.species.name);
      currentEvolution = currentEvolution.evolves_to[0];
    } while (!!currentEvolution && currentEvolution.hasOwnProperty('evolves_to'));

    return names;
  }

}