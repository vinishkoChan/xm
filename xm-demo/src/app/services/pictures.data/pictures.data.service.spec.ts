import { TestBed } from '@angular/core/testing';
import { PicturesDataService } from './pictures.data.service';

describe('PicturesDataService', () => {
  let service: PicturesDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PicturesDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
