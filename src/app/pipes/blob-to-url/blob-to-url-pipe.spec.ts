import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlobToUrlPipe } from './blob-to-url-pipe';

describe('BlobToUrlPipe', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const createObjectURL = vi.fn<(obj: Blob | MediaSource) => string>();

  let pipe: BlobToUrlPipe;

  beforeEach(() => {
    createObjectURL.mockReset().mockReturnValue('blob:mocked-url');
    URL.createObjectURL = createObjectURL;

    pipe = new BlobToUrlPipe();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return the object URL created for the given blob', () => {
    const blob = new Blob(['data'], { type: 'image/jpeg' });

    const result = pipe.transform(blob);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(result).toBe('blob:mocked-url');
  });

  it('should create a separate object URL for every transform call', () => {
    createObjectURL.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');

    const first = pipe.transform(new Blob(['a']));
    const second = pipe.transform(new Blob(['b']));

    expect(first).toBe('blob:first');
    expect(second).toBe('blob:second');
    expect(createObjectURL).toHaveBeenCalledTimes(2);
  });
});
