import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged, filter, map, takeUntil, catchError } from 'rxjs/operators';

import { Pokemon } from '../../models/pokemon.models';
import { PokemonService } from '../../services/pokemon.services';
import { FavoritesService } from '../../services/favorite.servcice';
import { PokemonCardSkeletonComponent } from '../pokemon-card-skeleton/pokemon-card-skeleton.component';
import { PokemonDetailComponent } from '../pokemon-details/pokemon-detail.component';
import { PokeballAnimationComponent } from '../../shared/pokeball-animation/pokeball-animation';

@Component({
    selector: 'app-pokemon-list',
    standalone: true,
    imports: [
        CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatButtonModule,
        MatProgressSpinnerModule, MatChipsModule, MatDialogModule, MatFormFieldModule,
        MatInputModule, PokemonCardSkeletonComponent, MatIconModule, PokeballAnimationComponent
    ],
    templateUrl: './pokemon-list.component.html',
    styleUrls: ['./pokemon-list.component.scss']
})
export class PokemonListComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    isLoading = true;
    private allPokemons = new BehaviorSubject<Pokemon[]>([]);
    randomPokemons$ = this.allPokemons.asObservable();
    filteredPokemons$ = new BehaviorSubject<Pokemon[]>([]);
    searchControl = new FormControl('');
    showAnimation = false;
    pendingPokemonName: string | null = null;
    private dialogInstance?: MatDialogRef<PokemonDetailComponent>;

    private typeColors: { [key: string]: string } = {
        normal: '#A8A878', fire: '#F08030', water: '#6890F0', grass: '#78C850',
        electric: '#F8D030', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
        ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
        rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
        steel: '#B8B8D0', fairy: '#EE99AC'
    };

    isBrowser: boolean;

    constructor(
        private pokemonService: PokemonService,
        private dialog: MatDialog,
        private router: Router,
        private route: ActivatedRoute,
        private zone: NgZone,
        private cdr: ChangeDetectorRef,
        public favoritesService: FavoritesService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        // Determinamos si la ejecución es en el navegador
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    ngOnInit(): void {
        this.loadPokemons();
        this.setupSearch();

        // La lógica de rutas y diálogos solo se debe ejecutar en el navegador
        if (this.isBrowser) {
            this.handleRouteChanges();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.dialogInstance?.close(); // Asegurarse de cerrar el diálogo al destruir
    }

    public getSpriteUrl(pokemon: Pokemon): string {
        return pokemon.sprites.other?.['official-artwork']?.front_default ||
            pokemon.sprites.front_default ||
            '';
    }

    getGradientForPokemon(pokemon: Pokemon): { [key: string]: string } {
        const types = pokemon.types.map(t => t.type.name);
        const color1 = this.typeColors[types[0]] || '#E0E0E0';
        const color2 = types.length > 1 ? this.typeColors[types[1]] : '#F5F5F5';
        return {
            'background': `linear-gradient(140deg, ${color1} 0%, ${color2} 100%)`
        };
    }

    private loadPokemons(): void {
        this.isLoading = true;
        this.pokemonService.getRandomPokemons(30).subscribe({
            next: (data) => {
                this.zone.run(() => {
                    this.allPokemons.next(data);
                    this.isLoading = false;
                    this.cdr.markForCheck();
                });
            },
            error: (err) => {
                console.error('Error al cargar los Pokémon', err);
                this.zone.run(() => { this.isLoading = false; this.cdr.markForCheck(); });
            }
        });
    }

    private setupSearch(): void {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((value) => {
                const query = (value || '').trim().toLowerCase();
                if (!query) return of([]);
                this.isLoading = true;
                return this.pokemonService.getPokemonDetails(query).pipe(
                    map(pokemon => [pokemon]),
                    catchError(() => of([]))
                );
            }),
            takeUntil(this.destroy$)
        ).subscribe(results => {
            this.filteredPokemons$.next(results);
            this.isLoading = false;
            this.cdr.markForCheck();
        });
    }

    toggleFavorite(event: MouseEvent, pokemonId: number): void {
        event.stopPropagation();
        this.favoritesService.toggleFavorite(pokemonId);
    }

    goToDetails(pokemonName: string): void {
        this.pendingPokemonName = pokemonName;
        this.showAnimation = true;
    }

    onAnimationDone(): void {
        if (this.pendingPokemonName) {
            this.router.navigate(['/pokemon', this.pendingPokemonName.toLowerCase()]);
            this.pendingPokemonName = null;
        }
        this.showAnimation = false;
    }

    /**
     * Gestiona la apertura y cierre del modal basado en la URL.
     * Funciona tanto para la navegación como para la carga inicial de la página.
     */
    private handleRouteChanges(): void {
        // 1. Reacciona a los cambios de navegación del router
        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            map(() => this.route.firstChild?.snapshot.params['name']),
            takeUntil(this.destroy$)
        ).subscribe(pokemonName => {
            this.updateDialogState(pokemonName);
        });

        // 2. Comprueba la ruta inicial en cuanto el componente se carga
        const initialName = this.route.firstChild?.snapshot.params['name'];
        if (initialName) {
            this.updateDialogState(initialName);
        }
    }

    /**
     * Lógica centralizada para abrir, cerrar o ignorar el modal.
     * @param pokemonName El nombre del pokémon de la URL, o undefined si no hay.
     */
    private updateDialogState(pokemonName?: string): void {
        // Si no hay nombre en la URL, cierra cualquier diálogo abierto.
        if (!pokemonName) {
            this.dialogInstance?.close();
            return;
        }

        // Si el diálogo ya está abierto para este pokémon, no hagas nada.
        if (this.dialogInstance?.componentInstance?.pokemon?.name.toLowerCase() === pokemonName.toLowerCase()) {
            return;
        }

        // Si hay otro diálogo abierto, ciérralo antes de abrir el nuevo.
        this.dialogInstance?.close();

        // Busca el pokémon y abre el modal
        this.pokemonService.getPokemonDetails(pokemonName.toLowerCase()).subscribe({
            next: (pokemon) => this.openPokemonDetailModal(pokemon.name),
            error: (err) => {
                console.error(`Pokémon "${pokemonName}" no encontrado. Redirigiendo...`, err);
                this.router.navigate(['/']);
            }
        });
    }

    private openPokemonDetailModal(pokemonName: string): void {
        if (this.dialogInstance) return; // Doble chequeo para evitar múltiples instancias

        this.dialogInstance = this.dialog.open(PokemonDetailComponent, {
            width: '90%',
            maxWidth: '800px',
            minHeight: '550px',
            panelClass: 'pokemon-dialog-container',
            data: { name: pokemonName }
        });

        this.dialogInstance.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
            // Al cerrar el diálogo, nos aseguramos de que la URL refleje el estado base.
            if (this.route.firstChild?.snapshot.params['name']) {
                this.router.navigate(['/']);
            }
            this.dialogInstance = undefined;
        });
    }

    getAbilities(pokemon: Pokemon): string {
        return pokemon.abilities?.map(a => a.ability.name).join(', ') || '-';
    }
}