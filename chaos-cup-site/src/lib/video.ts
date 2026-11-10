/** Turns a video address from Sanity into something the page can play. */
export function videoSource(url?: string): { kind: 'embed' | 'file'; src: string } | undefined {
  if (!url) return undefined;

  const youtube = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (youtube) return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${youtube[1]}?rel=0` };

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: 'embed', src: `https://player.vimeo.com/video/${vimeo[1]}?dnt=1` };

  return { kind: 'file', src: url };
}
