import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PicturePreview } from '@components/picture-preview/picture-preview';
import { Picture } from '@models';
import { PictureCollection } from './picture-collection';

describe('PictureCollection', () => {
  let component: PictureCollection;
  let fixture: ComponentFixture<PictureCollection>;

  let observerCallback: IntersectionObserverCallback | null = null;
  let observerOptions: IntersectionObserverInit | undefined;

  const mockObserve = vi.fn();
  const mockDisconnect = vi.fn();
  const mockUnobserve = vi.fn();

  const originalCreateObjectURL = URL.createObjectURL;

  const mockPictures: Picture[] = [
    { id: 'pic-1', blob: new Blob(['1']), isFavorite: false },
    { id: 'pic-2', blob: new Blob(['2']), isFavorite: true },
    { id: 'pic-3', blob: new Blob(['3']), isFavorite: false },
  ];

  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      observerCallback = callback;
      observerOptions = options;
    }

    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = mockUnobserve;
  }

  beforeEach(async () => {
    observerCallback = null;
    observerOptions = undefined;

    mockObserve.mockClear();
    mockDisconnect.mockClear();
    mockUnobserve.mockClear();

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    URL.createObjectURL = vi.fn(() => 'blob:mocked-url');

    await TestBed.configureTestingModule({
      imports: [PictureCollection],
    }).compileComponents();

    fixture = TestBed.createComponent(PictureCollection);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    URL.createObjectURL = originalCreateObjectURL;
  });

  function setPictures(pictures: Picture[] = []): void {
    fixture.componentRef.setInput('pictures', pictures);
  }

  function setupTrigger(): HTMLElement {
    const mockNativeElement = document.createElement('div');
    const mockSignal = signal(new ElementRef(mockNativeElement));

    Object.defineProperty(component, 'trigger', {
      value: mockSignal,
      writable: true,
    });

    return mockNativeElement;
  }

  function triggerIntersection(isIntersecting: boolean): void {
    expect(observerCallback).toBeTypeOf('function');

    observerCallback!(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  }

  function query<T extends Element = HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it('should create the component', () => {
    setPictures();

    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should initialize with default loading value as false', () => {
    setPictures();

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
  });

  it('should accept custom loading values via inputs', () => {
    setPictures();
    fixture.componentRef.setInput('loading', true);

    fixture.detectChanges();

    expect(component.loading()).toBe(true);
  });

  it('should setup the IntersectionObserver when the trigger element is available', async () => {
    setPictures();

    const mockNativeElement = setupTrigger();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(observerCallback).toBeTypeOf('function');
    expect(mockObserve).toHaveBeenCalledTimes(1);
    expect(mockObserve).toHaveBeenCalledWith(mockNativeElement);
  });

  it('should emit bottomReached when the trigger element intersects', async () => {
    setPictures();

    const emitSpy = vi.fn();
    component.bottomReached.subscribe(emitSpy);

    setupTrigger();

    fixture.detectChanges();
    await fixture.whenStable();

    triggerIntersection(true);

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit bottomReached when the trigger element does not intersect', async () => {
    setPictures();

    const emitSpy = vi.fn();
    component.bottomReached.subscribe(emitSpy);

    setupTrigger();

    fixture.detectChanges();
    await fixture.whenStable();

    triggerIntersection(false);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  describe('with an empty picture list', () => {
    beforeEach(async () => {
      setPictures([]);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should render the placeholder', () => {
      expect(query('.picture-collection__placeholder-container')).not.toBeNull();
      expect(query('.picture-collection__placeholder-text')?.textContent?.trim()).toBe(
        'Nothing to display yet',
      );
      expect(query<HTMLImageElement>('img')?.getAttribute('src')).toBe('gallery-placeholder.svg');
    });

    it('should not render the grid', () => {
      expect(query('.picture-collection__grid')).toBeNull();
      expect(fixture.debugElement.queryAll(By.directive(PicturePreview))).toHaveLength(0);
    });

    it('should not create an IntersectionObserver since there is no load trigger', () => {
      expect(observerCallback).toBeNull();
      expect(mockObserve).not.toHaveBeenCalled();
    });

    it('should not render the loader even when loading', async () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(query('mat-progress-spinner')).toBeNull();
    });
  });

  describe('with pictures', () => {
    beforeEach(async () => {
      setPictures(mockPictures);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should render a preview for every picture in order', () => {
      const previews = fixture.debugElement.queryAll(By.directive(PicturePreview));

      expect(previews).toHaveLength(mockPictures.length);
      expect(previews.map((p) => (p.componentInstance as PicturePreview).picture())).toEqual(
        mockPictures,
      );
    });

    it('should not render the placeholder', () => {
      expect(query('.picture-collection__placeholder-container')).toBeNull();
    });

    it('should emit pictureClick with the clicked picture', () => {
      const emitSpy = vi.fn();
      component.pictureClick.subscribe(emitSpy);

      const previews = fixture.debugElement.queryAll(By.directive(PicturePreview));
      (previews[1].nativeElement as HTMLElement).click();

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith(mockPictures[1]);
    });

    it('should observe the real load trigger element with a 10px root margin', () => {
      expect(mockObserve).toHaveBeenCalledTimes(1);

      const observed = mockObserve.mock.calls[0][0] as HTMLElement;
      const grid = query('.picture-collection__grid');

      expect(observed).toBeInstanceOf(HTMLDivElement);
      expect(observed.previousElementSibling).toBe(grid);
      expect(observerOptions).toEqual({ rootMargin: '10px' });
    });

    it('should show the loader only while loading', async () => {
      expect(query('mat-progress-spinner')).toBeNull();

      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(query('mat-progress-spinner')).not.toBeNull();

      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(query('mat-progress-spinner')).toBeNull();
    });

    it('should disconnect the observer when the component is destroyed', () => {
      expect(mockDisconnect).not.toHaveBeenCalled();

      fixture.destroy();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should disconnect the observer when the list becomes empty', async () => {
      setPictures([]);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
