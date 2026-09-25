import { TestBed } from '@angular/core/testing';
import { PicturesApiService } from './pictures.api.service';

describe('PicturesApiService', () => {
  let service: PicturesApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PicturesApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
