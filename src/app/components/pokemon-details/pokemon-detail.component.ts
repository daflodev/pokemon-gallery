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
        // MatProgressBarModule, // <- descomenta si lo usas en el HTML
        BaseChartDirective,
        PokemonDetailSkeletonComponent,
        PokedexComponent,
    ],
    templateUrl: './pokemon-details.component.html',
    styleUrls: ['./pokemon-details.component.scss'],
})
export class PokemonDetailComponent implements OnInit {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    // IA / Pokédex  👇  (cambia null -> string)
    aiBio: string = '';
    isBioLoading = false;
    showPokedex = false;

    pokemon?: Pokemon;
    isLoading = true;
    public isBrowser: boolean;

    evolutions: EvolutionDetail[] = [];
    isLoadingEvolutions = true;

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

    public radarChartData: ChartData<'radar'> = {
        labels: [],
        datasets: [{ data: [], label: 'Stats' }],
    };
    public radarChartType: ChartType = 'radar';

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

    // 🔒 Getters seguros (devuelven string SIEMPRE)
    get displayName(): string {
        const n = this.pokemon?.name ?? '';
        return n ? n.charAt(0).toUpperCase() + n.slice(1) : '';
    }

    get displaySpriteUrl(): string {
        // Resuelve aquí para no mezclar ?. con ['official-artwork'] en la plantilla
        const other: any = this.pokemon?.sprites?.other ?? {};
        const artwork = other['official-artwork']?.front_default as string | undefined;
        const home = other['home']?.front_default as string | undefined;
        const dream = other['dream_world']?.front_default as string | undefined;
        const front = this.pokemon?.sprites?.front_default ?? undefined;
        return artwork || home || dream || front || '';
    }

    ngOnInit(): void {
        const dialogName = this.data?.name;
        const routeName = this.route.snapshot.paramMap.get('name') ?? undefined;
        const name = dialogName ?? routeName;

        if (!name) {
            this.isLoading = false;
            return;
        }

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

        this.chart?.update();
    }

    closeIfDialog(): void {
        this.showPokedex = false;
        this.dialogRef?.close?.();
    }
}
