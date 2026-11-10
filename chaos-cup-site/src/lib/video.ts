/** Turns a video address from Sanity into something the page can play. */
export type VideoSource =
  | {
      kind: 'embed';
      /** Player address for an iframe. */
      src: string;
      /** The video on its own site, for visitors without JavaScript. */
      watchUrl?: string;
      /** A still from the video, shown until the visitor presses play. */
      thumbnail?: string;
    }
  | { kind: 'file'; src: string };

export function videoSource(url?: string): VideoSource | undefined {
  if (!url) return undefined;

  const youtube = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (youtube) {
    const id = youtube[1];
    return {
      kind: 'embed',
      src: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: 'embed', src: `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`, watchUrl: `https://vimeo.com/${vimeo[1]}` };

  return { kind: 'file', src: url };
}
