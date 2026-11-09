import { sanityClient } from 'sanity:client';
import imageUrlBuilder from '@sanity/image-url';

export { sanityClient };
const builder = imageUrlBuilder(sanityClient);
export const urlFor = (source: any) => builder.image(source).auto('format');
