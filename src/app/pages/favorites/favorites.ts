import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractGallery } from '@classes';
import { PictureCollection } from '@components';
import { Picture } from '@models';

@Component({
  imports: [PictureCollection],
  selector: 'app-favorites',
  styleUrl: './favorites.scss',
  templateUrl: './favorites.html',
})
export class Favorites extends AbstractGallery {
  private readonly router = inject(Router);

  constructor() {
    super();
  }

  public override handlePictureClick(picture: Picture): void {
    this.router.navigate(['photo', picture.id]);
  }

  protected override initPictures(): void {
    this.pictureDataService.getStoredPictures().subscribe((pictures) => {
      this._pictures.set(pictures);
    });
  }
}
