import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Picture } from '@models';
import { PicturesApiService, PicturesDataService } from '@services';
import { AbstractGallery } from './gallery.abstract.class';

const initPicturesSpy = vi.fn();

class TestGallery extends AbstractGallery {
  public override handlePictureClick(_picture: Picture): void {}

  protected override initPictures(): void {
    initPicturesSpy(this);
    this._pictures.set([{ id: 'init', blob: new Blob(), isFavorite: false }]);
  }

  public exposeServices() {
    return { api: this.picturesApiService, data: this.pictureDataService };
  }

  public exposeLoading() {
    return this._loading();
  }
}

describe('AbstractGallery', () => {
  const apiServiceMock = { getPictures: vi.fn() };
  const dataServiceMock = { getStoredPictures: vi.fn() };

  let gallery: TestGallery;

  beforeEach(() => {
    initPicturesSpy.mockClear();

    TestBed.configureTestingModule({
      providers: [
        { provide: PicturesApiService, useValue: apiServiceMock },
        { provide: PicturesDataService, useValue: dataServiceMock },
      ],
    });

    gallery = TestBed.runInInjectionContext(() => new TestGallery());
  });

  it('should call initPictures exactly once on construction', () => {
    expect(initPicturesSpy).toHaveBeenCalledTimes(1);
    expect(initPicturesSpy).toHaveBeenCalledWith(gallery);
  });

  it('should expose pictures set by initPictures through the readonly signal', () => {
    expect(gallery.pictures()).toEqual([{ id: 'init', blob: expect.any(Blob), isFavorite: false }]);
  });

  it('should expose pictures as a readonly signal without a setter', () => {
    expect('set' in gallery.pictures).toBe(false);
    expect('update' in gallery.pictures).toBe(false);
  });

  it('should inject the pictures api and data services', () => {
    const { api, data } = gallery.exposeServices();

    expect(api).toBe(apiServiceMock);
    expect(data).toBe(dataServiceMock);
  });

  it('should start with loading set to false', () => {
    expect(gallery.exposeLoading()).toBe(false);
  });
});
