import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Picture } from '@models';
import { delay, forkJoin, map, Observable } from 'rxjs';
import { v4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class PicturesApiService {
  private readonly httpClient = inject(HttpClient);

  public getPictures(length: number): Observable<Picture[]> {
    return forkJoin(
      Array.from({ length }, (_, i) => i).map(() =>
        this.fetchPicture().pipe(
          map(
            (blob) =>
              ({
                id: v4(),
                blob,
                isFavorite: false,
              }) as Picture,
          ),
        ),
      ),
    ).pipe(delay(500));
  }

  private fetchPicture(): Observable<Blob> {
    return this.httpClient.get('https://picsum.photos/200/300', { responseType: 'blob' });
  }
}
