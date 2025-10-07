import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-pokeball-animation',
  standalone: true,
  templateUrl: './pokeball-animation.component.html',
  styleUrls: ['./pokeball-animation.component.scss']
})
export class PokeballAnimationComponent {
  @Output() animationDone = new EventEmitter<void>();

  isOpen = false;

  ngOnInit() {
    // Fase 1: Sacudida
    setTimeout(() => {
      this.isOpen = true;

      // Fase 2: Apertura de la parte superior
      setTimeout(() => {
        this.animationDone.emit();
      }, 600);
    }, 700); // duración del shake
  }
}
