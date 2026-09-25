import { Component } from '@angular/core';
import { Picture } from '@models/picture.type';
import { AbstractGallery } from '@classes';
import { Observable } from 'rxjs';
import { PictureCollection } from '@components';

@Component({
  imports: [PictureCollection],
  selector: 'app-gallery',
  styleUrl: './gallery.scss',
  templateUrl: './gallery.html',
})
export class Gallery extends AbstractGallery {
  constructor() {
    super();
  }

  public handlePictureClick(picture: Picture): void {
    if (picture.isFavorite) {
      return;
    }

    picture.isFavorite = true;
    this.pictureDataService.storePicture(picture).subscribe(() => {
      this._pictures.update((pictures) => {
        return [...pictures];
      });
    });
  }

  public loadMorePictures(): void {
    this.loadPictures().subscribe((pictures) =>
      this._pictures.update((displayed) => displayed.concat(pictures)),
    );
  }

  protected override initPictures(): void {
    this.loadPictures().subscribe((pictures) => this._pictures.set(pictures));
  }

  private loadPictures(): Observable<Picture[]> {
    return this.picturesApiService.getPictures(50);
  }
}
