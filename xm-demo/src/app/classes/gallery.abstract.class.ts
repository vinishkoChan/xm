import { Directive, inject, signal } from '@angular/core';
import { Picture } from '@models';
import { PicturesApiService, PicturesDataService } from '@services';

@Directive()
export abstract class AbstractGallery {
  protected readonly picturesApiService = inject(PicturesApiService);
  protected readonly pictureDataService = inject(PicturesDataService);

  protected readonly _pictures = signal<Picture[]>([]);
  protected readonly _loading = signal<boolean>(false);

  public readonly pictures = this._pictures.asReadonly();

  constructor() {
    this.initPictures();
  }

  public abstract handlePictureClick(picture: Picture): void;

  protected abstract initPictures(): void;
}
