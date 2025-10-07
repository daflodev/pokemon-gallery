import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokeballAnimation } from './pokeball-animation';

describe('PokeballAnimation', () => {
  let component: PokeballAnimation;
  let fixture: ComponentFixture<PokeballAnimation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokeballAnimation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokeballAnimation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
