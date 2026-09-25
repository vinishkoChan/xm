import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PictureCollection } from '@components';
import { Picture } from '@models';
import { PicturesApiService, PicturesDataService } from '@services';
import { Favorites } from './favorites';

describe('Favorites', () => {
  let component: Favorites;
  let fixture: ComponentFixture<Favorites>;

  let storedPictures$: Subject<Picture[]>;

  const apiServiceMock = { getPictures: vi.fn() };
  const dataServiceMock = { getStoredPictures: vi.fn() };
  const routerMock = { navigate: vi.fn() };

  const originalCreateObjectURL = URL.createObjectURL;

  const storedPictures: Picture[] = [
    { id: 'fav-1', blob: new Blob(['1']), isFavorite: true },
    { id: 'fav-2', blob: new Blob(['2']), isFavorite: true },
  ];

  function getCollection(): PictureCollection {
    return fixture.debugElement.query(By.directive(PictureCollection)).componentInstance;
  }

  beforeEach(async () => {
    storedPictures$ = new Subject<Picture[]>();
    apiServiceMock.getPictures.mockReset();
    dataServiceMock.getStoredPictures.mockReset().mockReturnValue(storedPictures$);
    routerMock.navigate.mockReset().mockResolvedValue(true);

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    URL.createObjectURL = vi.fn(() => 'blob:mocked-url');

    await TestBed.configureTestingModule({
      imports: [Favorites],
      providers: [
        { provide: PicturesApiService, useValue: apiServiceMock },
        { provide: PicturesDataService, useValue: dataServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Favorites);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    URL.createObjectURL = originalCreateObjectURL;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request stored pictures on creation', () => {
    expect(dataServiceMock.getStoredPictures).toHaveBeenCalledTimes(1);
  });

  it('should not fetch pictures from the remote api', () => {
    expect(apiServiceMock.getPictures).not.toHaveBeenCalled();
  });

  it('should start with an empty list and show the placeholder', () => {
    expect(component.pictures()).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('.picture-collection__placeholder-container'),
    ).not.toBeNull();
  });

  it('should display the stored pictures once they are loaded', async () => {
    storedPictures$.next(storedPictures);
    await fixture.whenStable();

    expect(component.pictures()).toEqual(storedPictures);
    expect(getCollection().pictures()).toEqual(storedPictures);
  });

  it('should not show a loader', () => {
    expect(getCollection().loading()).toBe(false);
  });

  it('should navigate to the photo page when a picture is clicked', () => {
    component.handlePictureClick(storedPictures[1]);

    expect(routerMock.navigate).toHaveBeenCalledWith(['photo', 'fav-2']);
  });

  it('should handle pictureClick emitted by the collection', async () => {
    storedPictures$.next(storedPictures);
    await fixture.whenStable();

    getCollection().pictureClick.emit(storedPictures[0]);

    expect(routerMock.navigate).toHaveBeenCalledWith(['photo', 'fav-1']);
  });
});

describe('Favorites with synchronously available storage', () => {
  it('should display pictures that are available immediately', async () => {
    const pictures: Picture[] = [{ id: 'sync', blob: new Blob(), isFavorite: true }];
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mocked-url');
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );

    try {
      await TestBed.configureTestingModule({
        imports: [Favorites],
        providers: [
          { provide: PicturesApiService, useValue: {} },
          { provide: PicturesDataService, useValue: { getStoredPictures: () => of(pictures) } },
          { provide: Router, useValue: { navigate: vi.fn() } },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(Favorites);
      await fixture.whenStable();

      expect(fixture.componentInstance.pictures()).toEqual(pictures);
    } finally {
      vi.unstubAllGlobals();
      URL.createObjectURL = originalCreateObjectURL;
    }
  });
});
