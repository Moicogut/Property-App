export const getSafeImageUrl = (property: any): string => {
  const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

  if (!property) return DEFAULT_FALLBACK;

  const extractUrl = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'string') {
      const match = val.match(/https?:\/\/[^"'\s,}\]]+/);
      return match ? match[0] : null;
    }
    if (Array.isArray(val) && val.length > 0) {
      return extractUrl(val[0]);
    }
    return null;
  };

  const imgFromImages = extractUrl(property.images);
  if (imgFromImages) return imgFromImages;

  const imgFromImageUrl = extractUrl(property.image_url);
  if (imgFromImageUrl) return imgFromImageUrl;

  return DEFAULT_FALLBACK;
};

export const getSafeImageArray = (property: any): string[] => {
  if (!property) return [];

  const extractUrls = (val: any): string[] => {
    if (!val) return [];
    if (typeof val === 'string') {
      const matches = val.match(/https?:\/\/[^"'\s,}\]]+/g);
      return matches ? Array.from(matches) : [];
    }
    if (Array.isArray(val)) {
      let urls: string[] = [];
      val.forEach(v => urls.push(...extractUrls(v)));
      return urls;
    }
    return [];
  };

  const imagesUrls = extractUrls(property.images);
  const imageUrls = extractUrls(property.image_url);

  return Array.from(new Set([...imagesUrls, ...imageUrls]));
};
