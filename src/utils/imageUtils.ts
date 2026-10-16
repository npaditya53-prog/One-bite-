/**
 * Optimizes image URLs (specifically Unsplash CDN parameters) to ensure high performance,
 * WebP/AVIF format auto-selection, size compression, and responsive widths.
 */
export function getOptimizedImageUrl(url?: string, width = 600, quality = 75): string {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=75';
  }

  // If already an Unsplash image, adjust or append width & quality parameters
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  return url;
}
