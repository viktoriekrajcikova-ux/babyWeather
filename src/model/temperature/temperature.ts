export function kelvinToCelsius(kelvin: number): number {
    return kelvin - 273.15;
}

export function kelvinToRoundedCelsius(kelvin: number): number {
    return Math.round(kelvinToCelsius(kelvin));
}