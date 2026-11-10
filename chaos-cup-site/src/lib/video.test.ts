import { describe, expect, it } from 'vitest';
import { videoSource } from './video';

describe('videoSource', () => {
  it('embeds YouTube links in privacy mode', () => {
    expect(videoSource('https://www.youtube.com/watch?v=abc123XYZ_-')).toEqual({
      kind: 'embed',
      src: 'https://www.youtube-nocookie.com/embed/abc123XYZ_-?rel=0',
      watchUrl: 'https://www.youtube.com/watch?v=abc123XYZ_-',
      thumbnail: 'https://i.ytimg.com/vi/abc123XYZ_-/sddefault.jpg',
    });
    expect(videoSource('https://youtu.be/abc123XYZ_-')?.src).toBe('https://www.youtube-nocookie.com/embed/abc123XYZ_-?rel=0');
    expect(videoSource('https://youtu.be/Qf3iqOOS_yA?si=x')?.src).toBe('https://www.youtube-nocookie.com/embed/Qf3iqOOS_yA?rel=0');
    expect(videoSource('https://www.youtube.com/shorts/abc123XYZ_-')?.src).toBe(
      'https://www.youtube-nocookie.com/embed/abc123XYZ_-?rel=0',
    );
  });
  it('embeds Vimeo links', () => {
    expect(videoSource('https://vimeo.com/123456789')).toEqual({
      kind: 'embed',
      src: 'https://player.vimeo.com/video/123456789?dnt=1',
      watchUrl: 'https://vimeo.com/123456789',
    });
  });
  it('plays anything else as a file', () => {
    expect(videoSource('https://x.public.blob.vercel-storage.com/videos/how.mp4')).toEqual({
      kind: 'file',
      src: 'https://x.public.blob.vercel-storage.com/videos/how.mp4',
    });
  });
  it('returns nothing without a URL', () => {
    expect(videoSource(undefined)).toBeUndefined();
    expect(videoSource('')).toBeUndefined();
  });
});
