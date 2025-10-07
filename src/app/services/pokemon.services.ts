import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Pokemon, PokemonSpecies } from '../models/pokemon.models';



interface PokemonListResponse {
  results: { name: string; url: string }[];
}


export interface EvolutionDetail {
  name: string;
  imageUrl: string;
  types: { type: { name: string } }[];
}

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private baseUrl = 'https://pokeapi.co/api/v2';
  private POKEMON_LIMIT = 1025;

  constructor(private http: HttpClient) { }

  getPokemonDetails(name: string): Observable<Pokemon> {
    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${name.toLowerCase()}`);
  }

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


  getPokemonEvolutions(pokemonName: string): Observable<EvolutionDetail[]> {
    return this.http.get<PokemonSpecies>(`${this.baseUrl}/pokemon-species/${pokemonName}`).pipe(
      switchMap(species => {
        if (!species.evolution_chain?.url) {
          return of([]);
        }
        return this.http.get<any>(species.evolution_chain.url);
      }),
      switchMap(evolutionData => {
        const evolutionNames = this.parseEvolutionChainForNames(evolutionData.chain);
        if (evolutionNames.length === 0) {
          return of([]);
        }
        // Pedimos los detalles de todos los Pokémon de la evolución en paralelo
        const detailRequests = evolutionNames.map(name => this.getPokemonDetails(name));
        return forkJoin(detailRequests);
      }),
      map(pokemonDetailsArray => {

        return pokemonDetailsArray.map(pokemon => ({
          name: pokemon.name,
          imageUrl: pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || '',
          types: pokemon.types
        }));
      }),
      catchError(() => of([]))
    );
  }


  private parseEvolutionChainForNames(chain: any): string[] {
    const names: string[] = [];
    let currentEvolution = chain;

    do {
      names.push(currentEvolution.species.name);
      currentEvolution = currentEvolution.evolves_to[0];
    } while (!!currentEvolution && currentEvolution.hasOwnProperty('evolves_to'));

    return names;
  }

}