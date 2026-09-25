import { describe, expect, it } from 'vitest';
import { Favorites } from './pages/favorites/favorites';
import { Gallery } from './pages/gallery/gallery';
import { Photo } from './pages/picture/photo';
import { routes } from './app.routes';

describe('app routes', () => {
  function findRoute(path: string) {
    const route = routes.find((r) => r.path === path);
    expect(route, `route "${path}" should be defined`).toBeDefined();
    return route!;
  }

  it('should define exactly the gallery, favorites and photo routes', () => {
    expect(routes.map((r) => r.path)).toEqual(['', 'favorites', 'photo/:id']);
  });

  it.each([
    ['', Gallery],
    ['favorites', Favorites],
    ['photo/:id', Photo],
  ])('should lazy load the right component for "%s"', async (path, component) => {
    const route = findRoute(path);

    expect(route.component).toBeUndefined();
    expect(route.loadComponent).toBeTypeOf('function');
    await expect(route.loadComponent!()).resolves.toBe(component);
  });
});
