import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { PicturePreview } from './picture-preview';
import { BlobToUrlPipe } from '@pipes/blob-to-url';
import { Picture } from '@models/picture.type';

@Pipe({
  name: 'blobToUrl',
  standalone: true,
})
class MockBlobToUrlPipe implements PipeTransform {
  transform(value: any): string {
    return 'mocked-url-string';
  }
}

describe('PicturePreview', () => {
  let component: PicturePreview;
  let fixture: ComponentFixture<PicturePreview>;

  const mockPicture: Picture = {
    id: 'pic_123',
    blob: new Blob(['data'], { type: 'image/jpeg' }),
    isFavorite: false,
  };

  function getFavoriteIcon(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.picture-preview__favorite-icon');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicturePreview],
    })
      .overrideComponent(PicturePreview, {
        remove: { imports: [BlobToUrlPipe] },
        add: { imports: [MockBlobToUrlPipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PicturePreview);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('picture', mockPicture);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should correctly receive and store the picture input signal', () => {
    fixture.componentRef.setInput('picture', mockPicture);
    fixture.detectChanges();

    expect(component.picture()).toEqual(mockPicture);
    expect(component.picture().isFavorite).toBe(false);
  });

  it('should update the view and state when the picture changes dynamically', () => {
    fixture.componentRef.setInput('picture', mockPicture);
    fixture.detectChanges();

    const favoritePicture: Picture = {
      ...mockPicture,
      isFavorite: true,
    };

    fixture.componentRef.setInput('picture', favoritePicture);
    fixture.detectChanges();

    expect(component.picture().isFavorite).toBe(true);
    expect(getFavoriteIcon()).not.toBeNull();
  });

  it('should render the image with the url produced by the blobToUrl pipe', () => {
    fixture.componentRef.setInput('picture', mockPicture);
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');

    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('mocked-url-string');
  });

  it('should not render the favorite icon for a non-favorite picture', () => {
    fixture.componentRef.setInput('picture', mockPicture);
    fixture.detectChanges();

    expect(getFavoriteIcon()).toBeNull();
  });

  it('should render the star icon for a favorite picture', () => {
    fixture.componentRef.setInput('picture', { ...mockPicture, isFavorite: true });
    fixture.detectChanges();

    expect(getFavoriteIcon()?.textContent?.trim()).toBe('star');
  });

  it('should throw when the required picture input is not set', () => {
    expect(() => fixture.detectChanges()).toThrow(/NG0950/);
  });
});
