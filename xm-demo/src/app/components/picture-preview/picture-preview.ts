import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Picture } from '@models/picture.type';
import { BlobToUrlPipe } from '@pipes/blob-to-url';

@Component({
  imports: [BlobToUrlPipe, MatIconModule],
  selector: 'app-picture-preview',
  styleUrl: './picture-preview.scss',
  templateUrl: './picture-preview.html',
})
export class PicturePreview {
  public readonly picture = input.required<Picture>();
}
