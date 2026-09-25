import { inject, Service } from '@angular/core';
import { Picture } from '@models';
import { NgxIndexedDBService, WithID } from 'ngx-indexed-db';
import { Observable } from 'rxjs';

type DBEntry = Picture & WithID;

@Service()
export class PicturesDataService {
  private readonly dbService = inject(NgxIndexedDBService);

  public storePicture(picture: Picture): Observable<DBEntry> {
    return this.dbService.add('pictures', picture);
  }

  public getStoredPictures(): Observable<Picture[]> {
    return this.dbService.getAll<DBEntry>('pictures');
  }

  public getStoredPictureById(dbKey: string): Observable<Picture> {
    return this.dbService.getByKey<Picture>('pictures', dbKey);
  }

  public deleteStoredPictureById(dbKey: string): Observable<void> {
    return this.dbService.deleteByKey('pictures', dbKey);
  }
}
