import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Picture } from '@models';
import { PicturesApiService } from './pictures.api.service';

const PICSUM_URL = 'https://picsum.photos/200/300';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('PicturesApiService', () => {
  let service: PicturesApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PicturesApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request the requested amount of pictures from picsum as blobs', () => {
    service.getPictures(3).subscribe();

    const requests = httpTesting.match(PICSUM_URL);

    expect(requests).toHaveLength(3);
    requests.forEach((req) => {
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
    });

    requests.forEach((req) => req.flush(new Blob(['img'])));
    vi.runAllTimers();
  });

  it('should map every fetched blob to a non-favorite picture with a unique uuid', () => {
    const blobs = [new Blob(['1']), new Blob(['2']), new Blob(['3'])];
    let result: Picture[] | undefined;

    service.getPictures(3).subscribe((pictures) => (result = pictures));

    httpTesting.match(PICSUM_URL).forEach((req, i) => req.flush(blobs[i]));
    vi.advanceTimersByTime(500);

    expect(result).toHaveLength(3);
    expect(result!.map((p) => p.blob)).toEqual(blobs);
    expect(result!.every((p) => p.isFavorite === false)).toBe(true);
    expect(result!.every((p) => UUID_REGEX.test(p.id))).toBe(true);
    expect(new Set(result!.map((p) => p.id)).size).toBe(3);
  });

  it('should preserve request order even if responses arrive out of order', () => {
    const blobs = [new Blob(['first']), new Blob(['second'])];
    let result: Picture[] | undefined;

    service.getPictures(2).subscribe((pictures) => (result = pictures));

    const [firstReq, secondReq] = httpTesting.match(PICSUM_URL);
    secondReq.flush(blobs[1]);
    firstReq.flush(blobs[0]);
    vi.advanceTimersByTime(500);

    expect(result!.map((p) => p.blob)).toEqual(blobs);
  });

  it('should emit only after all requests completed and a 500ms delay passed', () => {
    const next = vi.fn();

    service.getPictures(2).subscribe(next);

    const [firstReq, secondReq] = httpTesting.match(PICSUM_URL);
    firstReq.flush(new Blob(['1']));
    vi.advanceTimersByTime(1000);
    expect(next).not.toHaveBeenCalled();

    secondReq.flush(new Blob(['2']));
    vi.advanceTimersByTime(499);
    expect(next).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should propagate an error when any of the requests fails', () => {
    const next = vi.fn();
    const error = vi.fn();

    service.getPictures(2).subscribe({ next, error });

    const [firstReq, secondReq] = httpTesting.match(PICSUM_URL);
    firstReq.flush(new Blob(['1']));
    secondReq.flush(null, { status: 500, statusText: 'Server Error' });
    vi.runAllTimers();

    expect(next).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0].status).toBe(500);
  });
});
