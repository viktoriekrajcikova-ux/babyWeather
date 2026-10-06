import { useEffect } from 'react';
import { useToast } from '../../../components/toast/toastContext';

interface WeatherErrorState {
  isError: boolean;
  isLoadingError: boolean;
  isSuccess: boolean;
  errorUpdatedAt: number;
}

export function useWeatherErrorToast(id: string, state: WeatherErrorState) {
  const { showError, dismiss } = useToast();
  const { isError, isLoadingError, isSuccess, errorUpdatedAt } = state;

  useEffect(() => {
    if (isError) {
      showError({
        id,
        title: isLoadingError ? 'Could not load weather' : 'Could not refresh weather',
        message: 'Check your connection and use Try again on the page.',
      });
    } else if (isSuccess) {
      dismiss(id);
    }
  }, [id, isError, isLoadingError, isSuccess, errorUpdatedAt, showError, dismiss]);

  useEffect(() => () => dismiss(id), [id, dismiss]);
}
