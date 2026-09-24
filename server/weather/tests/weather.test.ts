// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather } from '../weather';

const { redisGet, redisSet } = vi.hoisted(() => ({
  redisGet: vi.fn(),
  redisSet: vi.fn(),
}));

vi.mock('../../lib/redis', () => ({ redis: { get: redisGet, set: redisSet } }));

const fetchMock = vi.fn<typeof fetch>();
const upstreamWeather = {
  timezone: 'Europe/Prague',
  hourly: {
    time: [1700000000],
    temperature_2m: [12],
    apparent_temperature: [10],
    weather_code: [0],
    is_day: [1],
  },
};
const validWeather = {
  timezone: 'Europe/Prague',
  hourly: [
    {
      temp: 285.15,
      feels_like: 283.15,
      dt: 1700000000,
      weather: [{ description: 'Clear sky', icon: 'clear' }],
    },
  ],
};

describe('server getWeather', () => {
  beforeEach(() => {
    vi.stubEnv('OPENWEATHER_API_KEY', undefined);
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    redisGet.mockReset().mockResolvedValue(null);
    redisSet.mockReset().mockResolvedValue('OK');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('bez API klíče načte Open-Meteo a převede Celsius na Kelvin', async () => {
    vi.stubEnv('OPENWEATHER_API_KEY', undefined);
    fetchMock.mockResolvedValueOnce(Response.json(upstreamWeather));

    await expect(getWeather(50.08, 14.43)).resolves.toEqual(validWeather);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, options] = fetchMock.mock.calls[0];
    expect(input).toBeInstanceOf(URL);
    const url = input as URL;
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.pathname).toBe('/v1/forecast');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      latitude: '50.08',
      longitude: '14.43',
      hourly: 'temperature_2m,apparent_temperature,weather_code,is_day',
      forecast_hours: '48',
      timeformat: 'unixtime',
      timezone: 'auto',
      temperature_unit: 'celsius',
    });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(redisGet).toHaveBeenCalledWith('babyweather:weather:openmeteo:v2:50.08:14.43:en');
    expect(redisSet).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalledWith(
      'babyweather:weather:openmeteo:v2:50.08:14.43:en',
      validWeather,
      { ex: 300 },
    );
  });

  it('platnou cache vrátí bez volání Open-Meteo a bez prodloužení expirace', async () => {
    redisGet.mockResolvedValueOnce(validWeather);

    await expect(getWeather(50.08, 14.43)).resolves.toEqual(validWeather);

    expect(redisGet).toHaveBeenCalledTimes(1);
    expect(redisGet).toHaveBeenCalledWith('babyweather:weather:openmeteo:v2:50.08:14.43:en');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('neplatnou cache nahradí ověřenými daty z Open-Meteo', async () => {
    redisGet.mockResolvedValueOnce({ hourly: [] });
    fetchMock.mockResolvedValueOnce(Response.json(upstreamWeather));

    await expect(getWeather(0, 0)).resolves.toEqual(validWeather);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalledWith('babyweather:weather:openmeteo:v2:0:0:en', validWeather, {
      ex: 300,
    });
  });

  it('různé souřadnice čtou různé klíče cache', async () => {
    redisGet.mockResolvedValue(validWeather);

    await getWeather(50, 14);
    await getWeather(51, 14);
    await getWeather(50, 15);

    expect(redisGet.mock.calls).toEqual([
      ['babyweather:weather:openmeteo:v2:50:14:en'],
      ['babyweather:weather:openmeteo:v2:51:14:en'],
      ['babyweather:weather:openmeteo:v2:50:15:en'],
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('při selhání čtení Redis neobchází cache voláním Open-Meteo', async () => {
    redisGet.mockRejectedValueOnce(new Error('Redis read failed'));

    await expect(getWeather(0, 0)).rejects.toThrow('Redis read failed');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('selhání zápisu do Redis nezamlčí', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(upstreamWeather));
    redisSet.mockRejectedValueOnce(new Error('Redis write failed'));

    await expect(getWeather(0, 0)).rejects.toThrow('Redis write failed');

    expect(redisSet).toHaveBeenCalledWith('babyweather:weather:openmeteo:v2:0:0:en', validWeather, {
      ex: 300,
    });
  });

  it.each([
    [0, 'clear', 'Clear sky'],
    [1, 'clear', 'Mainly clear'],
    [2, 'partly-cloudy', 'Partly cloudy'],
    [3, 'cloudy', 'Overcast'],
    [45, 'fog', 'Fog'],
    [48, 'fog', 'Depositing rime fog'],
    [51, 'drizzle', 'Light drizzle'],
    [53, 'drizzle', 'Moderate drizzle'],
    [55, 'drizzle', 'Dense drizzle'],
    [56, 'freezing-rain', 'Light freezing drizzle'],
    [57, 'freezing-rain', 'Dense freezing drizzle'],
    [61, 'rain', 'Slight rain'],
    [63, 'rain', 'Moderate rain'],
    [65, 'rain', 'Heavy rain'],
    [66, 'freezing-rain', 'Light freezing rain'],
    [67, 'freezing-rain', 'Heavy freezing rain'],
    [71, 'snow', 'Slight snowfall'],
    [73, 'snow', 'Moderate snowfall'],
    [75, 'snow', 'Heavy snowfall'],
    [77, 'snow', 'Snow grains'],
    [80, 'showers', 'Slight rain showers'],
    [81, 'showers', 'Moderate rain showers'],
    [82, 'showers', 'Violent rain showers'],
    [85, 'snow-showers', 'Slight snow showers'],
    [86, 'snow-showers', 'Heavy snow showers'],
    [95, 'thunderstorm', 'Thunderstorm'],
    [96, 'thunderstorm', 'Thunderstorm with slight hail'],
    [99, 'thunderstorm', 'Thunderstorm with heavy hail'],
  ])('mapuje WMO %s na anglický popis a kategorii i v noci', async (code, icon, description) => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        timezone: 'Europe/Prague',
        hourly: {
          time: [1700000000, 1700003600],
          temperature_2m: [12, -5],
          apparent_temperature: [10, -8],
          weather_code: [code, code],
          is_day: [1, 0],
        },
      }),
    );

    await expect(getWeather(0, 0)).resolves.toEqual({
      timezone: 'Europe/Prague',
      hourly: [
        { temp: 285.15, feels_like: 283.15, dt: 1700000000, weather: [{ icon, description }] },
        { temp: 268.15, feels_like: 265.15, dt: 1700003600, weather: [{ icon, description }] },
      ],
    });
  });

  it.each([401, 429, 500])('HTTP %s odmítne obecnou chybou', async (status) => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: 'upstream detail' }, { status }));

    await expect(getWeather(0, 0)).rejects.toThrow('Weather service request failed');
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('síťová chyba nevede k úspěšné odpovědi', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network unavailable'));

    await expect(getWeather(0, 0)).rejects.toThrow('Network unavailable');
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('předá timeout signál a odmítnutí po přerušení nezamlčí', async () => {
    const controller = new AbortController();
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    fetchMock.mockImplementationOnce(
      (_input, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(options.signal?.reason), {
            once: true,
          });
        }),
    );

    try {
      const operation = getWeather(0, 0);
      const assertion = expect(operation).rejects.toMatchObject({ name: 'TimeoutError' });
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      expect(timeout).toHaveBeenCalledWith(5000);
      expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
      controller.abort(new DOMException('Test timeout', 'TimeoutError'));
      await assertion;
      expect(redisSet).not.toHaveBeenCalled();
    } finally {
      timeout.mockRestore();
    }
  });

  it('odmítne neplatný JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not json', { status: 200 }));

    await expect(getWeather(0, 0)).rejects.toThrow();
    expect(redisSet).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'chybí hourly', body: {} },
    { name: 'prázdné hourly', body: { hourly: [] } },
    {
      name: 'chybí pocitová teplota',
      body: { hourly: { ...upstreamWeather.hourly, apparent_temperature: undefined } },
    },
    {
      name: 'teplota je text',
      body: { hourly: { ...upstreamWeather.hourly, temperature_2m: ['12'] } },
    },
    {
      name: 'neznámý WMO kód',
      body: { hourly: { ...upstreamWeather.hourly, weather_code: [100] } },
    },
    { name: 'chybí kód', body: { hourly: { ...upstreamWeather.hourly, weather_code: undefined } } },
    { name: 'prázdný čas', body: { hourly: { ...upstreamWeather.hourly, time: [] } } },
    { name: 'neplatný den', body: { hourly: { ...upstreamWeather.hourly, is_day: [2] } } },
  ])('odmítne chybnou strukturu: $name', async ({ body }) => {
    fetchMock.mockResolvedValueOnce(Response.json({ timezone: 'Europe/Prague', ...body }));

    await expect(getWeather(0, 0)).rejects.toThrow();
    expect(redisSet).not.toHaveBeenCalled();
  });

  it.each(['time', 'temperature_2m', 'apparent_temperature', 'weather_code', 'is_day'] as const)(
    'odmítne nestejnou délku pole %s',
    async (field) => {
      fetchMock.mockResolvedValueOnce(
        Response.json({
          timezone: 'Europe/Prague',
          hourly: {
            ...upstreamWeather.hourly,
            [field]: [...upstreamWeather.hourly[field], upstreamWeather.hourly[field][0]],
          },
        }),
      );
      await expect(getWeather(0, 0)).rejects.toThrow();
      expect(redisSet).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, '', null, 123])(
    'odmítne chybějící nebo neplatnou timezone %s',
    async (timezone) => {
      fetchMock.mockResolvedValueOnce(Response.json({ ...upstreamWeather, timezone }));

      await expect(getWeather(0, 0)).rejects.toThrow();
      expect(redisSet).not.toHaveBeenCalled();
    },
  );

  it('cache bez timezone nahradí novou předpovědí', async () => {
    redisGet.mockResolvedValueOnce({ hourly: validWeather.hourly });
    fetchMock.mockResolvedValueOnce(Response.json(upstreamWeather));

    await expect(getWeather(50.08, 14.43)).resolves.toEqual(validWeather);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalledWith(
      'babyweather:weather:openmeteo:v2:50.08:14.43:en',
      validWeather,
      { ex: 300 },
    );
  });

  it.each([NaN, Infinity, -Infinity, null])(
    'odmítne neplatnou číselnou hodnotu %s',
    async (value) => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          timezone: 'Europe/Prague',
          hourly: { ...upstreamWeather.hourly, temperature_2m: [value] },
        }),
      } as Response);
      await expect(getWeather(0, 0)).rejects.toThrow();
      expect(redisSet).not.toHaveBeenCalled();
    },
  );
});
