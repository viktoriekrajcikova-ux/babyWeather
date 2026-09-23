import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis.js';

export const geocodingRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: false,
  prefix: 'babyweather:ratelimit:geocoding',
});
