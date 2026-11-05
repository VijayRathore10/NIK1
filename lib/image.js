// Resolves image sources (URLs, relative paths, or uploaded image objects)
export function resolveImage(source, width) {
  if (!source) return 'https://picsum.photos/seed/placeholder/800/600';
  if (typeof source === 'string') {
    if (
      source.startsWith('http://') ||
      source.startsWith('https://') ||
      source.startsWith('/') ||
      source.startsWith('data:')
    ) {
      return source;
    }
  }
  if (typeof source === 'object') {
    if (source.url) return source.url;
    if (source.asset?.url) return source.asset.url;
  }
  return 'https://picsum.photos/seed/placeholder/800/600';
}
