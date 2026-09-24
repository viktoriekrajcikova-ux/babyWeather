import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  CloudSunRain,
  Snowflake,
  Sun,
  CircleHelp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  'freezing-rain': CloudRainWind,
  snow: Snowflake,
  showers: CloudSunRain,
  'snow-showers': CloudSnow,
  thunderstorm: CloudLightning,
};

export default function WeatherIcon({
  icon,
  description,
  size = 64,
}: {
  icon: string;
  description: string;
  size?: number;
}) {
  const Icon = Object.prototype.hasOwnProperty.call(icons, icon) ? icons[icon] : CircleHelp;
  return (
    <Icon
      size={size}
      strokeWidth={1.5}
      role="img"
      aria-label={description || 'Weather condition unavailable'}
      aria-hidden={false}
    />
  );
}
