import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/toast/toastContext';

interface WeatherErrorState {
  isError: boolean;
  isLoadingError: boolean;
  isSuccess: boolean;
  errorUpdatedAt: number;
}

export function useWeatherErrorToast(id: string, state: WeatherErrorState) {
  const { showError, dismiss } = useToast();
  const { t } = useTranslation();
  const { isError, isLoadingError, isSuccess, errorUpdatedAt } = state;

  useEffect(() => {
    if (isError) {
      showError({
        id,
        title: isLoadingError ? t('weather.errors.load') : t('weather.errors.refresh'),
        message: t('weather.errors.retryHint'),
      });
    } else if (isSuccess) {
      dismiss(id);
    }
  }, [id, isError, isLoadingError, isSuccess, errorUpdatedAt, showError, dismiss, t]);

  useEffect(() => () => dismiss(id), [id, dismiss]);
}
