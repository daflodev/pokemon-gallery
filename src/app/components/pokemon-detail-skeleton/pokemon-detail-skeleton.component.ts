import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips'; // <-- IMPORTANTE: Importa el módulo de chips

@Component({
    selector: 'app-pokemon-detail-skeleton',
    standalone: true,
    imports: [
        CommonModule,
        MatChipsModule
    ],
    templateUrl: './pokemon-details-skeleton.html',
    styleUrls: ['./pokemon-details-skeleton.scss']
})
export class PokemonDetailSkeletonComponent { }