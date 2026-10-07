import type { TFunction } from 'i18next';

export function translateWeatherDescription(description: string, t: TFunction): string {
  if (!description) return t('weather.unknownCondition');
  return t(`weather.conditions.${description}`, { defaultValue: description });
}
