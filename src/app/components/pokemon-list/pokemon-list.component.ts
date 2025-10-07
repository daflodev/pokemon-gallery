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

/**
 * Componente principal que muestra una lista de Pokémon.
 * Gestiona la carga inicial de datos, la búsqueda en tiempo real, la visualización
 * de favoritos y la apertura de los detalles de un Pokémon en un modal sincronizado con la URL.
 */
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
    /** Subject para gestionar la desuscripción de observables y evitar fugas de memoria. */
    private destroy$ = new Subject<void>();

    /** Indica si la lista principal de Pokémon se está cargando. */
    isLoading = true;
    /** BehaviorSubject que almacena la lista completa de Pokémon aleatorios cargados. */
    private allPokemons = new BehaviorSubject<Pokemon[]>([]);
    /** Observable público para la lista de Pokémon aleatorios. */
    randomPokemons$ = this.allPokemons.asObservable();
    /** BehaviorSubject que almacena los resultados de la búsqueda. */
    filteredPokemons$ = new BehaviorSubject<Pokemon[]>([]);
    /** FormControl para el campo de búsqueda. */
    searchControl = new FormControl('');

    /** Controla la visibilidad de la animación de la Pokébola. */
    showAnimation = false;
    /** Almacena el nombre del Pokémon que se va a mostrar después de la animación. */
    pendingPokemonName: string | null = null;
    /** Referencia a la instancia del diálogo de detalles, si está abierto. */
    private dialogInstance?: MatDialogRef<PokemonDetailComponent>;

    /**
     * Mapa de colores para asignar un fondo a las tarjetas de Pokémon según su tipo principal.
     * @private
     */
    private typeColors: { [key: string]: string } = {
        normal: '#A8A878', fire: '#F08030', water: '#6890F0', grass: '#78C850',
        electric: '#F8D030', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
        ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
        rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
        steel: '#B8B8D0', fairy: '#EE99AC'
    };

    /** Flag para determinar si el código se está ejecutando en el navegador o en el servidor (SSR). */
    isBrowser: boolean;

    /**
     * Constructor del componente. Inyecta los servicios necesarios.
     * @param pokemonService Servicio para obtener datos de Pokémon.
     * @param favoritesService Servicio para gestionar los Pokémon favoritos.
     */
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

        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    /**
     * Ciclo de vida de Angular. Se ejecuta al inicializar el componente.
     */
    ngOnInit(): void {
        this.loadPokemons();
        this.setupSearch();


        if (this.isBrowser) {
            this.handleRouteChanges();
        }
    }

    /**
     * Ciclo de vida de Angular. Se ejecuta al destruir el componente.
     * Limpia las suscripciones y cierra el diálogo si está abierto.
     */
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.dialogInstance?.close();
    }

    /**
     * Obtiene la URL del sprite de mejor calidad disponible para un Pokémon.
     * @param pokemon El objeto Pokémon.
     * @returns La URL del sprite.
     */
    public getSpriteUrl(pokemon: Pokemon): string {
        return pokemon.sprites.other?.['official-artwork']?.front_default ||
            pokemon.sprites.front_default ||
            '';
    }

    /**
     * Genera un estilo de fondo de gradiente lineal basado en los tipos del Pokémon.
     * @param pokemon El objeto Pokémon.
     * @returns Un objeto de estilo CSS para `[ngStyle]`.
     */
    getGradientForPokemon(pokemon: Pokemon): { [key: string]: string } {
        const types = pokemon.types.map(t => t.type.name);
        const color1 = this.typeColors[types[0]] || '#A8A878'; // Default a normal
        const color2 = types.length > 1 ? this.typeColors[types[1]] : '#F5F5F5';
        return {
            'background': `linear-gradient(140deg, ${color1} 0%, ${color2} 100%)`
        };
    }

    private loadPokemons(): void {
        /**
         * Carga la lista inicial de Pokémon aleatorios desde el servicio.
         */
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

    /**
     * Configura la lógica de búsqueda reactiva.
     * Escucha los cambios en el campo de búsqueda, espera un momento para no saturar
     * la API y luego busca el Pokémon o limpia los resultados.
     */
    private setupSearch(): void {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((value) => {
                const query = (value ?? '').trim().toLowerCase();
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

    /**
     * Añade o quita un Pokémon de la lista de favoritos.
     * @param event El evento del mouse para detener la propagación y evitar que se abra el detalle.
     * @param pokemonId El ID del Pokémon a marcar/desmarcar.
     */
    toggleFavorite(event: MouseEvent, pokemonId: number): void {
        event.stopPropagation();
        this.favoritesService.toggleFavorite(pokemonId);
    }

    /**
     * Inicia el proceso para mostrar los detalles de un Pokémon.
     * Primero activa una animación y luego navega a la URL correspondiente.
     * @param pokemonName El nombre del Pokémon.
     */
    goToDetails(pokemonName: string): void {
        this.pendingPokemonName = pokemonName;
        this.showAnimation = true;
    }

    /**
     * Callback que se ejecuta cuando la animación de la Pokébola termina.
     * Realiza la navegación a la ruta del detalle del Pokémon.
     */
    onAnimationDone(): void {
        if (this.pendingPokemonName) {
            this.router.navigate(['/pokemon', this.pendingPokemonName.toLowerCase()]);
        }
        this.showAnimation = false;
    }

    /**
     * Gestiona la apertura y cierre del modal basado en la URL.
     * Funciona tanto para la navegación como para la carga inicial de la página.
     */
    private handleRouteChanges(): void {
        // Suscripción a los eventos de navegación para detectar cambios en la URL.
        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            map(() => this.route.firstChild?.snapshot.params['name']),
            takeUntil(this.destroy$)
        ).subscribe(pokemonName => {
            this.updateDialogState(pokemonName);
        });

        // Comprobación inicial al cargar el componente por si la URL ya contiene un nombre de Pokémon.
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
        // Si no hay nombre en la URL, cierra el diálogo si está abierto.
        if (!pokemonName) {
            this.dialogInstance?.close();
            return;
        }

        // Si el diálogo ya está abierto para el mismo Pokémon, no hace nada.
        if (this.dialogInstance?.componentInstance?.pokemon?.name.toLowerCase() === pokemonName.toLowerCase()) {
            return;
        }

        // Cierra cualquier diálogo existente antes de abrir uno nuevo.
        this.dialogInstance?.close();

        // Busca los detalles del Pokémon y, si tiene éxito, abre el modal.
        this.pokemonService.getPokemonDetails(pokemonName.toLowerCase()).subscribe({
            next: (pokemon) => this.openPokemonDetailModal(pokemon.name),
            error: (err) => {
                console.error(`Pokémon "${pokemonName}" no encontrado. Redirigiendo...`, err);
                this.router.navigate(['/']);
            }
        });
    }

    /**
     * Abre el modal de `PokemonDetailComponent` con la configuración adecuada.
     * @param pokemonName El nombre del Pokémon para pasar como dato al diálogo.
     */
    private openPokemonDetailModal(pokemonName: string): void {
        if (this.dialogInstance) return;

        this.dialogInstance = this.dialog.open(PokemonDetailComponent, {
            width: '90%',
            maxWidth: '800px',
            minHeight: '550px',
            panelClass: 'pokemon-dialog-container',
            data: { name: pokemonName }
        });

        this.dialogInstance.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
            // Cuando el diálogo se cierra, navega de vuelta a la raíz si la URL aún apunta a un Pokémon.
            if (this.route.firstChild?.snapshot.params['name']) {
                this.router.navigate(['/']);
            }
            this.dialogInstance = undefined;
            this.pendingPokemonName = null; // Limpia el nombre pendiente
        });
    }

    /**
     * Devuelve una cadena con las habilidades de un Pokémon, separadas por comas.
     */
    getAbilities(pokemon: Pokemon): string {
        return pokemon.abilities?.map(a => a.ability.name).join(', ') || '-';
    }
}