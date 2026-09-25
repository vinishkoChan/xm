import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PictureCollection } from './picture-collection';

describe('PictureCollection', () => {
  let component: PictureCollection;
  let fixture: ComponentFixture<PictureCollection>;

  let observerCallback: IntersectionObserverCallback | null = null;

  const mockObserve = vi.fn();
  const mockDisconnect = vi.fn();
  const mockUnobserve = vi.fn();

  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback;
    }

    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = mockUnobserve;
  }

  beforeEach(async () => {
    observerCallback = null;

    mockObserve.mockClear();
    mockDisconnect.mockClear();
    mockUnobserve.mockClear();

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    await TestBed.configureTestingModule({
      imports: [PictureCollection],
    }).compileComponents();

    fixture = TestBed.createComponent(PictureCollection);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  function setPictures(): void {
    fixture.componentRef.setInput('pictures', []);
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
});
