import { Routes } from '@angular/router';
import { PokemonListComponent } from './components/pokemon-list/pokemon-list.component';
import { ServerRoute, RenderMode } from '@angular/ssr';

export const routes: Routes = [
    {
        path: '',
        component: PokemonListComponent,
        // Definimos una ruta hija para manejar el modal
        children: [
            {
                // Esta ruta se activa con URLs como '/pokemon/pikachu'
                path: 'pokemon/:name',
                // AÑADIDO: Se necesita un componente para que la ruta sea válida.
                // Apuntar al mismo componente padre permite que la lógica del modal funcione.
                component: PokemonListComponent,
            }
        ]
    },
    // Redirigir cualquier otra URL a la página principal
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];

export const serverRoutes: ServerRoute[] = [
    { path: '', renderMode: RenderMode.Client },
    { path: 'pokemon/:name', renderMode: RenderMode.Client },
    { path: '**', renderMode: RenderMode.Client },
];
