import { BiosService } from './../../services/bio.services';
import {
    Component,
    OnInit,
    Inject,
    PLATFORM_ID,
    NgZone,
    ChangeDetectorRef,
    ViewChild,
    Optional,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { Pokemon } from '../../models/pokemon.models';
import { PokemonService, EvolutionDetail } from '../../services/pokemon.services';
import { PokemonDetailSkeletonComponent } from '../pokemon-detail-skeleton/pokemon-detail-skeleton.component';
import { PokedexComponent } from '../pokedex/pokedex.component';


/**
 * Componente para mostrar los detalles completos de un Pokémon.
 * Puede funcionar como una página independiente (a través de una ruta) o como un modal (MatDialog).
 * Muestra información como estadísticas, tipos, habilidades, evoluciones y una biografía generada por IA.
 */
@Component({
    selector: 'app-pokemon-detail',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatChipsModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,

        BaseChartDirective,
        PokemonDetailSkeletonComponent,
        PokedexComponent,
    ],
    templateUrl: './pokemon-details.component.html',
    styleUrls: ['./pokemon-details.component.scss'],
})
export class PokemonDetailComponent implements OnInit {
    /** Referencia a la directiva del gráfico para poder actualizarlo dinámicamente. */
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    /** Almacena la biografía del Pokémon generada por la IA. */
    aiBio: string = '';
    /** Indica si la biografía de la IA se está cargando. */
    isBioLoading = false;
    /** Controla si el componente Pokedex (que muestra la biografía) es visible. */
    showPokedex = false;

    /** El objeto Pokémon con todos sus detalles. */
    pokemon?: Pokemon;
    /** Indica si los datos principales del Pokémon se están cargando. */
    isLoading = true;
    /** Flag para determinar si el código se está ejecutando en el navegador (para renderizar el gráfico). */
    public isBrowser: boolean;

    /** Array que almacena la cadena de evolución del Pokémon. */
    evolutions: EvolutionDetail[] = [];
    /** Indica si la cadena de evolución se está cargando. */
    isLoadingEvolutions = true;

    // --- Configuración del Gráfico de Estadísticas (Chart.js) ---

    /** Opciones de configuración para el gráfico de radar. */
    public radarChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                angleLines: { color: 'rgba(0, 0, 0, 0.2)' },
                grid: { color: 'rgba(0, 0, 0, 0.2)' },
                pointLabels: { color: '#333', font: { size: 14, weight: 'bold' } },
                ticks: { display: false },
                suggestedMin: 0,
                suggestedMax: 160,
            },
        },
        plugins: { legend: { display: false } },
    };

    /** Datos que se mostrarán en el gráfico de radar (etiquetas y valores). */
    public radarChartData: ChartData<'radar'> = {
        labels: [],
        datasets: [{ data: [], label: 'Stats' }],
    };
    /** Tipo de gráfico a renderizar. */
    public radarChartType: ChartType = 'radar';

    /**
     * Constructor del componente.
     * @param pokemonService Servicio para obtener datos de Pokémon.
     * @param BiosService Servicio para generar la biografía con IA.
     * @param route Proporciona acceso a la información de la ruta actual.
     * @param data Datos inyectados cuando el componente se abre en un MatDialog. Es opcional.
     * @param dialogRef Referencia al diálogo, si el componente se abre como uno. Es opcional.
     * @param platformId Token para identificar si la app se ejecuta en el servidor o en el navegador.
     * @param zone Servicio de Angular para ejecutar trabajo dentro de la zona de Angular.
     * @param cdr Detector de cambios para forzar la actualización de la vista.
     */
    constructor(
        private pokemonService: PokemonService,
        private BiosService: BiosService,
        private route: ActivatedRoute,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: { name: string } | null,
        @Optional() public dialogRef: MatDialogRef<PokemonDetailComponent>,
        @Inject(PLATFORM_ID) private platformId: Object,
        private zone: NgZone,
        private cdr: ChangeDetectorRef
    ) {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    /**
     * Getter para obtener el nombre del Pokémon con la primera letra en mayúscula.
     * @returns El nombre formateado o una cadena vacía.
     */
    get displayName(): string {
        const n = this.pokemon?.name ?? '';
        return n ? n.charAt(0).toUpperCase() + n.slice(1) : '';
    }

    /**
     * Getter que busca la mejor URL de sprite disponible en un orden de preferencia.
     * @returns La URL del sprite o una cadena vacía.
     */
    get displaySpriteUrl(): string {
        const other: any = this.pokemon?.sprites?.other ?? {};
        const artwork = other['official-artwork']?.front_default as string | undefined;
        const home = other['home']?.front_default as string | undefined;
        const dream = other['dream_world']?.front_default as string | undefined;
        const front = this.pokemon?.sprites?.front_default ?? undefined;
        return artwork || home || dream || front || '';
    }

    /**
     * Ciclo de vida `ngOnInit`. Se ejecuta al inicializar el componente.
     * Determina si el nombre del Pokémon viene de la ruta o de los datos del diálogo y carga los datos.
     */
    ngOnInit(): void {
        const dialogName = this.data?.name;
        const routeName = this.route.snapshot.paramMap.get('name') ?? undefined;
        const name = dialogName ?? routeName; // Prioriza el nombre del diálogo sobre el de la ruta.

        if (!name) {
            this.isLoading = false;
            return;
        }

        // Carga los detalles principales del Pokémon.
        this.pokemonService.getPokemonDetails(name).subscribe({
            next: (details) => {
                this.zone.run(() => {
                    this.pokemon = details;
                    this.setupChartData(details);
                    this.isLoading = false;
                    this.cdr.markForCheck();
                });
            },
            error: (err) => {
                this.zone.run(() => {
                    console.error('Error al cargar los detalles del Pokémon', err);
                    this.isLoading = false;
                    this.cdr.markForCheck();
                });
            },
        });

        // Carga la cadena de evolución del Pokémon.
        this.pokemonService.getPokemonEvolutions(name).subscribe({
            next: (evolutionData) => {
                this.zone.run(() => {
                    this.evolutions = evolutionData;
                    this.isLoadingEvolutions = false;
                    this.cdr.markForCheck();
                });
            },
            error: () => {
                this.zone.run(() => {
                    this.isLoadingEvolutions = false;
                    this.cdr.markForCheck();
                });
            },
        });
    }

    /**
     * Solicita al `BiosService` que genere una biografía para el Pokémon actual.
     * Gestiona los estados de carga y muestra el resultado.
     */
    generateBio(): void {
        if (!this.pokemon) return;

        this.showPokedex = true;
        this.isBioLoading = true;
        this.aiBio = '';

        this.BiosService.createBio(this.pokemon).subscribe({
            next: (bio: string) => {
                this.zone.run(() => {
                    this.aiBio = bio || 'No se pudo generar la biografía.';
                    this.isBioLoading = false;
                    this.cdr.markForCheck();
                });
            },
            error: (_err: unknown) => {
                this.zone.run(() => {
                    this.aiBio = 'No se pudo generar la biografía en este momento.';
                    this.isBioLoading = false;
                    this.cdr.markForCheck();
                });
            },
        });
    }

    /**
     * Prepara los datos de las estadísticas del Pokémon para ser mostrados en el gráfico de radar.
     * @param pokemon El objeto Pokémon del cual extraer las estadísticas.
     */
    private setupChartData(pokemon: Pokemon): void {
        const statLabels: string[] = [];
        const statData: number[] = [];
        const map: Record<string, string> = {
            hp: 'HP',
            attack: 'Ataque',
            defense: 'Defensa',
            'special-attack': 'Sp. Atk',
            'special-defense': 'Sp. Def',
            speed: 'Velocidad',
        };

        // Mapea los nombres de las estadísticas y extrae sus valores base.
        pokemon.stats.forEach((s) => {
            statLabels.push(map[s.stat.name] || s.stat.name);
            statData.push(s.base_stat);
        });

        this.radarChartData = {
            labels: statLabels,
            datasets: [{
                data: statData,
                label: 'Estadísticas',
                backgroundColor: 'rgba(63, 81, 181, 0.25)',
                borderColor: 'rgba(63, 81, 181, 1)',
                pointBackgroundColor: 'rgba(63, 81, 181, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(63, 81, 181, 0.8)',
            }],
        };

        // Fuerza la actualización del gráfico si ya está renderizado.
        this.chart?.update();
    }

    /**
     * Cierra el componente si está funcionando como un diálogo (MatDialog).
     */
    closeIfDialog(): void {
        this.showPokedex = false;
        this.dialogRef?.close?.();
    }
}
