import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface WeatherErrorState {
  isError: boolean;
  isLoadingError: boolean;
  isSuccess: boolean;
  errorUpdatedAt: number;
}

export function useWeatherErrorToast(id: string, state: WeatherErrorState) {
  const { t } = useTranslation();
  const { isError, isLoadingError, isSuccess, errorUpdatedAt } = state;

  useEffect(() => {
    if (isError) {
      toast.error(
        `${isLoadingError ? t('weather.errors.load') : t('weather.errors.refresh')} ${t('weather.errors.retryHint')}`,
        { id },
      );
    } else if (isSuccess) {
      toast.dismiss(id);
    }
  }, [id, isError, isLoadingError, isSuccess, errorUpdatedAt, t]);

  useEffect(() => () => toast.dismiss(id), [id]);
}
