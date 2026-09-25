import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { PicturePreview } from '@components';
import { Picture } from '@models';
import { PicturesDataService } from '@services';
import { map, switchMap } from 'rxjs';

@Component({
  imports: [PicturePreview, MatButtonModule],
  selector: 'app-photo',
  styleUrl: './photo.scss',
  templateUrl: './photo.html',
})
export class Photo implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly picturesDataService = inject(PicturesDataService);
  private readonly router = inject(Router);

  private readonly _picture = signal<Picture | null>(null);

  public readonly picture = this._picture.asReadonly();

  public ngOnInit(): void {
    this.activatedRoute.params
      .pipe(
        map((params) => params['id']),
        switchMap((id) => this.picturesDataService.getStoredPictureById(id)),
      )
      .subscribe((picture) => {
        this._picture.set(picture);
      });
  }

  public removeFromFavorites(picture: Picture): void {
    this.picturesDataService.deleteStoredPictureById(picture.id).subscribe(() => {
      this.router.navigate(['favorites']);
    });
  }
}
