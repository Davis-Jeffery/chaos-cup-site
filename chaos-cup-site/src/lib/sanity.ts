import { sanityClient } from 'sanity:client';
import imageUrlBuilder from '@sanity/image-url';

export { sanityClient };

const builder = imageUrlBuilder(sanityClient);

/** Image URL builder. Always serves WebP/AVIF when the browser supports it. */
export const urlFor = (source: any) => builder.image(source).auto('format');

export const DEFAULT_WIDTHS = [320, 480, 640, 800, 1080, 1280, 1600, 1920];

/**
 * Builds src and srcset for a Sanity image.
 * With `aspect` (width / height) the image is cropped around its hotspot.
 * Without it the whole image is kept (use this for logos).
 */
export function imageSet(
  source: any,
  { widths = DEFAULT_WIDTHS, aspect, maxWidth }: { widths?: number[]; aspect?: number; maxWidth?: number } = {},
) {
  const sourceWidth: number | undefined = source?.asset?.metadata?.dimensions?.width;
  const limit = Math.min(maxWidth ?? Infinity, sourceWidth ?? Infinity);
  let list = widths.filter((w) => w <= limit);
  if (list.length === 0) list = [Math.min(widths[0], Number.isFinite(limit) ? limit : widths[0])];

  const build = (w: number) => {
    let b = urlFor(source).width(w);
    b = aspect ? b.height(Math.round(w / aspect)).fit('crop') : b.fit('max');
    return b.url();
  };

  return {
    src: build(list[list.length - 1]),
    srcset: list.map((w) => `${build(w)} ${w}w`).join(', '),
  };
}
