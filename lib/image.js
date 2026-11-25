import { sanitizeUrl } from './validation';

// Resolves image sources (URLs, relative paths, or uploaded image objects) safely
export function resolveImage(source) {
  const fallback = 'https://picsum.photos/seed/placeholder/800/600';
  if (!source) return fallback;

  if (typeof source === 'string') {
    return sanitizeUrl(source) || fallback;
  }

  if (typeof source === 'object') {
    const candidate = source.url || source.asset?.url || '';
    return sanitizeUrl(candidate) || fallback;
  }

  return fallback;
}
