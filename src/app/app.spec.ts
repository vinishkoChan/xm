import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';

@Component({ template: 'home page' })
class HomeStub {}

@Component({ template: 'favorites page' })
class FavoritesStub {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: HomeStub },
          { path: 'favorites', component: FavoritesStub },
        ]),
      ],
    }).compileComponents();
  });

  function getLinks(root: HTMLElement): HTMLAnchorElement[] {
    return Array.from(root.querySelectorAll<HTMLAnchorElement>('.app-header a'));
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the navigation links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const links = getLinks(fixture.nativeElement);

    expect(links.map((a) => a.textContent?.trim())).toEqual(['Photos', 'Favorites']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/favorites']);
  });

  it('should render a router outlet inside the content area', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.app-content router-outlet')).not.toBeNull();
  });

  it('should render the routed page and highlight only the Photos link on "/"', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();

    const [photos, favorites] = getLinks(fixture.nativeElement);

    expect(fixture.nativeElement.querySelector('.app-content').textContent).toContain('home page');
    expect(photos.classList).toContain('app-header__button--active');
    expect(favorites.classList).not.toContain('app-header__button--active');
  });

  it('should highlight only the Favorites link on "/favorites"', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/favorites');
    await fixture.whenStable();

    const [photos, favorites] = getLinks(fixture.nativeElement);

    expect(fixture.nativeElement.querySelector('.app-content').textContent).toContain(
      'favorites page',
    );
    expect(photos.classList).not.toContain('app-header__button--active');
    expect(favorites.classList).toContain('app-header__button--active');
  });

  it('should navigate when a navigation link is clicked', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    await fixture.whenStable();

    getLinks(fixture.nativeElement)[1].click();
    await fixture.whenStable();

    expect(router.url).toBe('/favorites');
  });
});
