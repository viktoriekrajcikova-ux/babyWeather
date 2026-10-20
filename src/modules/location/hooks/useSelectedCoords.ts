import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { selectedLocationAtom } from '../atoms/selectedLocationAtom';
import { STORAGE_KEY } from '../helpers/selectedLocationStorage';

export function useSelectedCoords() {
  const { t } = useTranslation();

  const coords = useAtomValue(selectedLocationAtom);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
      toast.dismiss('location-storage');
    } catch {
      toast.error(`${t('location.saveError')} ${t('location.saveHint')}`, {
        id: 'location-storage',
      });
    }
  }, [coords, t]);
  useEffect(() => () => toast.dismiss('location-storage'), []);
  return { coords };
}
