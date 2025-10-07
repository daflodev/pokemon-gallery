import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FavoritesService {
    private readonly favoritesKey = 'pokemonFavorites';

    private favoritesSubject: BehaviorSubject<number[]>;
    public favorites$: Observable<number[]>;

    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        this.isBrowser = isPlatformBrowser(this.platformId);

        const initialFavorites = this.getFavoritesFromStorage();
        this.favoritesSubject = new BehaviorSubject<number[]>(initialFavorites);
        this.favorites$ = this.favoritesSubject.asObservable();
    }

    private getFavoritesFromStorage(): number[] {
        if (!this.isBrowser) {
            return [];
        }
        const favorites = localStorage.getItem(this.favoritesKey);
        return favorites ? JSON.parse(favorites) : [];
    }

    private saveFavoritesToStorage(favorites: number[]): void {
        if (!this.isBrowser) {
            return;
        }
        localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
        this.favoritesSubject.next(favorites);
    }

    isFavorite(pokemonId: number): boolean {
        return this.favoritesSubject.getValue().includes(pokemonId);
    }

    toggleFavorite(pokemonId: number): void {
        const currentFavorites = this.favoritesSubject.getValue();
        if (this.isFavorite(pokemonId)) {
            const updatedFavorites = currentFavorites.filter(id => id !== pokemonId);
            this.saveFavoritesToStorage(updatedFavorites);
        } else {
            const updatedFavorites = [...currentFavorites, pokemonId];
            this.saveFavoritesToStorage(updatedFavorites);
        }
    }
}