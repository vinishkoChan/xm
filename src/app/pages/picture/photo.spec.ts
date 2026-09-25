import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, config, of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PicturePreview } from '@components';
import { Picture } from '@models';
import { PicturesDataService } from '@services';
import { Photo } from './photo';

describe('Photo', () => {
  let component: Photo;
  let fixture: ComponentFixture<Photo>;

  let params$: BehaviorSubject<Params>;

  const dataServiceMock = {
    getStoredPictureById: vi.fn(),
    deleteStoredPictureById: vi.fn(),
  };
  const routerMock = { navigate: vi.fn() };

  const originalCreateObjectURL = URL.createObjectURL;

  const pictures: Record<string, Picture> = {
    'pic-1': { id: 'pic-1', blob: new Blob(['1']), isFavorite: true },
    'pic-2': { id: 'pic-2', blob: new Blob(['2']), isFavorite: true },
  };

  function getButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button');
  }

  function getPreview(): PicturePreview | undefined {
    return fixture.debugElement.query(By.directive(PicturePreview))?.componentInstance;
  }

  beforeEach(async () => {
    params$ = new BehaviorSubject<Params>({ id: 'pic-1' });

    dataServiceMock.getStoredPictureById
      .mockReset()
      .mockImplementation((id: string) => of(pictures[id]));
    dataServiceMock.deleteStoredPictureById.mockReset().mockReturnValue(of(undefined));
    routerMock.navigate.mockReset().mockResolvedValue(true);

    URL.createObjectURL = vi.fn(() => 'blob:mocked-url');

    await TestBed.configureTestingModule({
      imports: [Photo],
      providers: [
        { provide: ActivatedRoute, useValue: { params: params$ } },
        { provide: PicturesDataService, useValue: dataServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Photo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loading the picture', () => {
    it('should request the stored picture using the id from route params', () => {
      expect(dataServiceMock.getStoredPictureById).toHaveBeenCalledWith('pic-1');
      expect(component.picture()).toEqual(pictures['pic-1']);
    });

    it('should render the preview and the remove button', () => {
      expect(getPreview()?.picture()).toEqual(pictures['pic-1']);
      expect(getButton()?.textContent?.trim()).toBe('Remove from favorites');
    });

    it('should load a new picture when the route id changes', async () => {
      params$.next({ id: 'pic-2' });
      await fixture.whenStable();

      expect(dataServiceMock.getStoredPictureById).toHaveBeenLastCalledWith('pic-2');
      expect(component.picture()).toEqual(pictures['pic-2']);
      expect(getPreview()?.picture()).toEqual(pictures['pic-2']);
    });

    it('should ignore a stale response when the route id changes before it resolves', async () => {
      const slow$ = new Subject<Picture>();
      dataServiceMock.getStoredPictureById.mockImplementation((id: string) =>
        id === 'pic-1' ? slow$ : of(pictures[id]),
      );

      params$.next({ id: 'pic-1' });
      params$.next({ id: 'pic-2' });
      slow$.next(pictures['pic-1']);
      await fixture.whenStable();

      expect(component.picture()).toEqual(pictures['pic-2']);
    });

    it('should render nothing when the picture is not found', async () => {
      params$.next({ id: 'missing' });
      await fixture.whenStable();

      expect(component.picture()).toBeFalsy();
      expect(getPreview()).toBeUndefined();
      expect(getButton()).toBeNull();
    });
  });

  describe('before the picture is loaded', () => {
    it('should render nothing', async () => {
      TestBed.resetTestingModule();
      dataServiceMock.getStoredPictureById.mockReturnValue(new Subject<Picture>());

      await TestBed.configureTestingModule({
        imports: [Photo],
        providers: [
          { provide: ActivatedRoute, useValue: { params: of({ id: 'pic-1' }) } },
          { provide: PicturesDataService, useValue: dataServiceMock },
          { provide: Router, useValue: routerMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(Photo);
      await fixture.whenStable();

      expect(fixture.componentInstance.picture()).toBeNull();
      expect(fixture.nativeElement.querySelector('.photo__container')).toBeNull();
    });
  });

  describe('removeFromFavorites', () => {
    it('should delete the picture and navigate to favorites', () => {
      component.removeFromFavorites(pictures['pic-1']);

      expect(dataServiceMock.deleteStoredPictureById).toHaveBeenCalledWith('pic-1');
      expect(routerMock.navigate).toHaveBeenCalledWith(['favorites']);
    });

    it('should navigate only after the deletion completed', () => {
      const deleted$ = new Subject<void>();
      dataServiceMock.deleteStoredPictureById.mockReturnValue(deleted$);

      component.removeFromFavorites(pictures['pic-1']);
      expect(routerMock.navigate).not.toHaveBeenCalled();

      deleted$.next();
      expect(routerMock.navigate).toHaveBeenCalledWith(['favorites']);
    });

    it('should not navigate when the deletion fails', () => {
      // The component has no error handler, so rxjs reports the error asynchronously.
      const onUnhandledError = vi.fn();
      config.onUnhandledError = onUnhandledError;
      vi.useFakeTimers();

      try {
        const error = new Error('db failure');
        dataServiceMock.deleteStoredPictureById.mockReturnValue(throwError(() => error));

        component.removeFromFavorites(pictures['pic-1']);
        vi.runAllTimers();

        expect(routerMock.navigate).not.toHaveBeenCalled();
        expect(onUnhandledError).toHaveBeenCalledWith(error);
      } finally {
        vi.useRealTimers();
        config.onUnhandledError = null;
      }
    });

    it('should be triggered by clicking the remove button', () => {
      getButton()!.click();

      expect(dataServiceMock.deleteStoredPictureById).toHaveBeenCalledWith('pic-1');
      expect(routerMock.navigate).toHaveBeenCalledWith(['favorites']);
    });
  });
});
