import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PicturePreview } from '@components/picture-preview/picture-preview';
import { Picture } from '@models';

@Component({
  imports: [PicturePreview, MatProgressSpinnerModule],
  selector: 'app-picture-collection',
  styleUrl: './picture-collection.scss',
  templateUrl: './picture-collection.html',
})
export class PictureCollection {
  public readonly pictures = input.required<Picture[]>();
  public readonly loading = input<boolean>(false);

  public readonly pictureClick = output<Picture>();
  public readonly bottomReached = output<void>();

  private readonly trigger = viewChild<ElementRef<HTMLDivElement>>('loadTrigger');

  constructor() {
    effect(() => {
      if (!this.trigger()) {
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            this.bottomReached.emit();
          }
        },
        {
          rootMargin: '10px',
        },
      );

      observer.observe(this.trigger()!.nativeElement);

      return () => observer.disconnect();
    });
  }
}
