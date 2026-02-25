import { useState, useEffect } from 'react';
import { getReferenceItems, ReferenceItem } from '../firebase/referenceAdapter';

/**
 * Hook to fetch reference items from Firestore
 * Usage: const roles = useReferenceData('ROLES');
 */
export function useReferenceData(collectionName: string, forceRefresh = false) {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getReferenceItems(collectionName, forceRefresh);
        setItems(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionName, forceRefresh]);

  return { items, loading, error };
}

/**
 * Create a map of code->label for quick lookups
 * Usage: const roleLabels = createLabelMap(roles)
 */
export function createLabelMap(items: ReferenceItem[]): Map<string, string> {
  const map = new Map<string, string>();
  items.forEach((item) => {
    map.set(item.code, item.label);
  });
  return map;
}

/**
 * Get label by code from items array
 */
export function getLabelFromItems(items: ReferenceItem[], code: string): string {
  const item = items.find((i) => i.code === code);
  return item?.label || code;
}

/**
 * Get meta value by code and key from items array
 */
export function getMetaFromItems(
  items: ReferenceItem[],
  code: string,
  metaKey: string
): any {
  const item = items.find((i) => i.code === code);
  return item?.meta?.[metaKey] || null;
}
