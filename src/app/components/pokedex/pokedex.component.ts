import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-pokedex',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
    templateUrl: './pokedex.component.html',
    styleUrls: ['./pokedex.component.scss']
})
export class PokedexComponent implements OnChanges {
    /** Nombre del Pokémon (para el header) */
    @Input() name = '';
    /** URL de la imagen/sprite a mostrar en la pantalla izquierda */
    @Input() spriteUrl = '';
    /** Texto de la Pokédex (bio IA) */
    @Input() text: string | null = null;
    /** Estado de carga mientras pedimos la bio */
    @Input() loading = false;

    /** Click en “Generar con IA” */
    @Output() generate = new EventEmitter<void>();

    //  Propiedades para el efecto de tipeo
    /** Texto que se muestra en la plantilla, se actualiza progresivamente */
    public displayedText = '';
    /** Referencia al intervalo para poder limpiarlo */
    public typingInterval: any;

    /**
     *  Detecta cambios en los inputs, especialmente en 'text'.
     * Cuando 'text' recibe un nuevo valor, iniciamos el efecto de tipeo.
     */
    ngOnChanges(changes: SimpleChanges): void {
        // Si la propiedad 'text' ha cambiado y no está en su primer cambio
        if (changes['text'] && !changes['text'].isFirstChange()) {
            this.startTypingEffect(this.text || '');
        }
    }

    /**
     * Inicia la animación de escritura.
     * Limpia cualquier animación anterior y empieza a revelar el nuevo texto.
     */
    private startTypingEffect(fullText: string): void {
        // Detener y limpiar cualquier animación de tipeo anterior
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }
        this.displayedText = '';

        if (!fullText) return;

        let currentIndex = 0;
        this.typingInterval = setInterval(() => {
            if (currentIndex < fullText.length) {
                this.displayedText += fullText[currentIndex];
                currentIndex++;
            } else {
                // Cuando termina, limpiamos el intervalo
                clearInterval(this.typingInterval);
                this.typingInterval = null;
            }
        }, 25); // Velocidad de tipeo en milisegundos
    }
}