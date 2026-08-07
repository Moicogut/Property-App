export const getSafeImageUrl = (property: any): string => {
  const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

  if (!property) return DEFAULT_FALLBACK;

  // 1. Evaluar si images es un Arreglo
  if (Array.isArray(property.images) && property.images.length > 0) {
    const first = property.images[0];
    if (typeof first === 'string' && first.startsWith('http')) return first;
  }

  // 2. Evaluar si images vino como String JSON desde PostgreSQL
  if (typeof property.images === 'string') {
    try {
      const parsed = JSON.parse(property.images);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string' && parsed[0].startsWith('http')) {
        return parsed[0];
      }
    } catch (e) {
      if (property.images.startsWith('http')) return property.images;
    }
  }

  // 3. Evaluar campo image_url
  if (typeof property.image_url === 'string' && property.image_url.startsWith('http')) {
    return property.image_url;
  }

  return DEFAULT_FALLBACK;
};
