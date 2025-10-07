import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips'; // Para los chips de tipo

@Component({
    selector: 'app-pokemon-card-skeleton',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatChipsModule], // Importa MatChipsModule si lo usas en el skeleton
    template: `
    <mat-card class="pokemon-card skeleton-card">
      <mat-card-header>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-subtitle"></div>
      </mat-card-header>
      <div class="card-image-container">
        <div class="skeleton-image"></div>
      </div>
      <mat-card-content class="summary">
        <div class="info-group">
          <strong>Habilidades:</strong>
          <div class="skeleton-line skeleton-text"></div>
        </div>
        <div class="info-group">
          <strong>Tipo:</strong>
          <div class="chips-container">
            <mat-chip-listbox>
              <mat-chip class="skeleton-chip"></mat-chip>
              <mat-chip class="skeleton-chip"></mat-chip>
            </mat-chip-listbox>
          </div>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <div class="skeleton-button"></div>
      </mat-card-actions>
    </mat-card>
  `,
    styleUrls: ['./pokemon-card-skeleton.scss']
})
export class PokemonCardSkeletonComponent { }