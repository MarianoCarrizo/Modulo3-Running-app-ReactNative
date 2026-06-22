const KM_TO_MI = 0.621371;

export function formatDistance(meters: number, unitSystem: 'metric' | 'imperial'): string {
  const km = meters / 1000;
  if (unitSystem === 'imperial') {
    return `${(km * KM_TO_MI).toFixed(2)} mi`;
  }
  return `${km.toFixed(2)} km`;
}

export function formatPace(paceMinKm: number, unitSystem: 'metric' | 'imperial'): string {
  if (!isFinite(paceMinKm) || isNaN(paceMinKm) || paceMinKm <= 0) return '--:--';
  const pace = unitSystem === 'imperial' ? paceMinKm / KM_TO_MI : paceMinKm;
  const totalSeconds = Math.round(pace * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')} /${unitSystem === 'imperial' ? 'mi' : 'km'}`;
}

export function displayToMeters(value: number, unitSystem: 'metric' | 'imperial'): number {
  const km = unitSystem === 'imperial' ? value / KM_TO_MI : value;
  return km * 1000;
}

export function metersToDisplay(meters: number, unitSystem: 'metric' | 'imperial'): number {
  const km = meters / 1000;
  return unitSystem === 'imperial' ? km * KM_TO_MI : km;
}

export function unitLabel(unitSystem: 'metric' | 'imperial'): string {
  return unitSystem === 'imperial' ? 'mi' : 'km';
}
