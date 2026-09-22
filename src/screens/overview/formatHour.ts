export function formatHour(dt: number): string {
    return `${new Date(dt * 1000).getHours()}:00`;
}