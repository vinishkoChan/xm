import { TestBed } from '@angular/core/testing';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Picture } from '@models';
import { PicturesDataService } from './pictures.data.service';

describe('PicturesDataService', () => {
  let service: PicturesDataService;

  const dbServiceMock = {
    add: vi.fn(),
    getAll: vi.fn(),
    getByKey: vi.fn(),
    deleteByKey: vi.fn(),
  };

  const picture: Picture = {
    id: 'pic-1',
    blob: new Blob(['data'], { type: 'image/jpeg' }),
    isFavorite: true,
  };

  beforeEach(() => {
    Object.values(dbServiceMock).forEach((fn) => fn.mockReset());

    TestBed.configureTestingModule({
      providers: [{ provide: NgxIndexedDBService, useValue: dbServiceMock }],
    });

    service = TestBed.inject(PicturesDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store a picture in the "pictures" store', () => {
    dbServiceMock.add.mockReturnValue(of(picture));
    const next = vi.fn();

    service.storePicture(picture).subscribe(next);

    expect(dbServiceMock.add).toHaveBeenCalledWith('pictures', picture);
    expect(next).toHaveBeenCalledWith(picture);
  });

  it('should return all stored pictures from the "pictures" store', () => {
    const stored = [picture, { ...picture, id: 'pic-2' }];
    dbServiceMock.getAll.mockReturnValue(of(stored));
    const next = vi.fn();

    service.getStoredPictures().subscribe(next);

    expect(dbServiceMock.getAll).toHaveBeenCalledWith('pictures');
    expect(next).toHaveBeenCalledWith(stored);
  });

  it('should return a stored picture by its key', () => {
    dbServiceMock.getByKey.mockReturnValue(of(picture));
    const next = vi.fn();

    service.getStoredPictureById('pic-1').subscribe(next);

    expect(dbServiceMock.getByKey).toHaveBeenCalledWith('pictures', 'pic-1');
    expect(next).toHaveBeenCalledWith(picture);
  });

  it('should delete a stored picture by its key', () => {
    dbServiceMock.deleteByKey.mockReturnValue(of(undefined));
    const next = vi.fn();

    service.deleteStoredPictureById('pic-1').subscribe(next);

    expect(dbServiceMock.deleteByKey).toHaveBeenCalledWith('pictures', 'pic-1');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
