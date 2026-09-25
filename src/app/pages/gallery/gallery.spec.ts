import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PictureCollection } from '@components';
import { Picture } from '@models';
import { PicturesApiService, PicturesDataService } from '@services';
import { Gallery } from './gallery';

describe('Gallery', () => {
  let component: Gallery;
  let fixture: ComponentFixture<Gallery>;

  const apiServiceMock = { getPictures: vi.fn() };
  const dataServiceMock = { storePicture: vi.fn() };

  const originalCreateObjectURL = URL.createObjectURL;

  function createPictures(prefix: string, count: number): Picture[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `${prefix}-${i}`,
      blob: new Blob([`${prefix}-${i}`]),
      isFavorite: false,
    }));
  }

  function getCollection(): PictureCollection {
    return fixture.debugElement.query(By.directive(PictureCollection)).componentInstance;
  }

  // Recreated per test: the component mutates `isFavorite` on the pictures it receives.
  let initialPictures: Picture[];

  beforeEach(async () => {
    initialPictures = createPictures('initial', 2);
    apiServiceMock.getPictures.mockReset().mockReturnValue(of(initialPictures));
    dataServiceMock.storePicture.mockReset();

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    URL.createObjectURL = vi.fn(() => 'blob:mocked-url');

    await TestBed.configureTestingModule({
      imports: [Gallery],
      providers: [
        { provide: PicturesApiService, useValue: apiServiceMock },
        { provide: PicturesDataService, useValue: dataServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Gallery);
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

  describe('initialization', () => {
    it('should load 50 pictures on creation', () => {
      expect(apiServiceMock.getPictures).toHaveBeenCalledTimes(1);
      expect(apiServiceMock.getPictures).toHaveBeenCalledWith(50);
    });

    it('should display the loaded pictures', () => {
      expect(component.pictures()).toEqual(initialPictures);
      expect(getCollection().pictures()).toEqual(initialPictures);
    });

    it('should always pass loading=true to the collection', () => {
      expect(getCollection().loading()).toBe(true);
    });
  });

  describe('loadMorePictures', () => {
    it('should append the newly loaded pictures to the displayed ones', () => {
      const morePictures = createPictures('more', 3);
      apiServiceMock.getPictures.mockReturnValue(of(morePictures));

      component.loadMorePictures();

      expect(apiServiceMock.getPictures).toHaveBeenLastCalledWith(50);
      expect(component.pictures()).toEqual([...initialPictures, ...morePictures]);
    });

    it('should keep the order of pages when requests complete one after another', () => {
      const page2 = createPictures('page2', 1);
      const page3 = createPictures('page3', 1);
      apiServiceMock.getPictures.mockReturnValueOnce(of(page2)).mockReturnValueOnce(of(page3));

      component.loadMorePictures();
      component.loadMorePictures();

      expect(component.pictures()).toEqual([...initialPictures, ...page2, ...page3]);
    });

    it('should not change displayed pictures until the request resolves', () => {
      const response$ = new Subject<Picture[]>();
      apiServiceMock.getPictures.mockReturnValue(response$);

      component.loadMorePictures();
      expect(component.pictures()).toEqual(initialPictures);

      const morePictures = createPictures('more', 1);
      response$.next(morePictures);
      expect(component.pictures()).toEqual([...initialPictures, ...morePictures]);
    });

    it('should be triggered when the collection reports bottomReached', () => {
      const spy = vi.spyOn(component, 'loadMorePictures');

      getCollection().bottomReached.emit();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handlePictureClick', () => {
    it('should mark the picture as favorite and store it', () => {
      const picture = { ...initialPictures[0] };
      dataServiceMock.storePicture.mockReturnValue(of(picture));

      component.handlePictureClick(picture);

      expect(picture.isFavorite).toBe(true);
      expect(dataServiceMock.storePicture).toHaveBeenCalledWith(
        expect.objectContaining({ id: picture.id, isFavorite: true }),
      );
    });

    it('should emit a new pictures array reference after storing so the view re-renders', () => {
      const before = component.pictures();
      dataServiceMock.storePicture.mockReturnValue(of(before[0]));

      component.handlePictureClick(before[0]);

      const after = component.pictures();
      expect(after).not.toBe(before);
      expect(after).toEqual(before);
    });

    it('should not refresh the pictures until the picture is stored', () => {
      const stored$ = new Subject<Picture>();
      dataServiceMock.storePicture.mockReturnValue(stored$);
      const before = component.pictures();

      component.handlePictureClick({ ...before[1] });
      expect(component.pictures()).toBe(before);

      stored$.next(before[1]);
      expect(component.pictures()).not.toBe(before);
    });

    it('should do nothing for a picture that is already a favorite', () => {
      const before = component.pictures();
      const favorite: Picture = { ...initialPictures[0], isFavorite: true };

      component.handlePictureClick(favorite);

      expect(dataServiceMock.storePicture).not.toHaveBeenCalled();
      expect(component.pictures()).toBe(before);
    });

    it('should not store the same picture twice when clicked repeatedly', () => {
      const picture = { ...initialPictures[0] };
      dataServiceMock.storePicture.mockReturnValue(of(picture));

      component.handlePictureClick(picture);
      component.handlePictureClick(picture);

      expect(dataServiceMock.storePicture).toHaveBeenCalledTimes(1);
    });

    it('should be triggered when the collection emits pictureClick', () => {
      const spy = vi.spyOn(component, 'handlePictureClick').mockImplementation(() => {});

      getCollection().pictureClick.emit(initialPictures[1]);

      expect(spy).toHaveBeenCalledWith(initialPictures[1]);
    });
  });
});
