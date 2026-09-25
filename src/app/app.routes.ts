import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/gallery/gallery').then((c) => c.Gallery),
  },
  {
    path: 'favorites',
    loadComponent: () => import('./pages/favorites/favorites').then((c) => c.Favorites),
  },
  {
    path: 'photo/:id',
    loadComponent: () => import('./pages/picture/photo').then((c) => c.Photo),
  },
];
