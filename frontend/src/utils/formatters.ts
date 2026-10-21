import { CycloneCategory } from '../types/cyclone';

export function formatCoordinates(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

export function formatWindSpeed(knots: number, unit: 'kt' | 'kmh' | 'mph' = 'kt'): string {
  if (unit === 'kmh') {
    return `${Math.round(knots * 1.852)} km/h`;
  }
  if (unit === 'mph') {
    return `${Math.round(knots * 1.15078)} mph`;
  }
  return `${knots} kt`;
}

export function formatPressure(hpa?: number): string {
  if (hpa === undefined || hpa === null) return 'N/A';
  return `${hpa} hPa`;
}

export function getCategoryBadgeStyle(category: CycloneCategory | string): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  const catLower = category.toLowerCase();

  if (catLower.includes('cat 5') || catLower.includes('category 5') || catLower.includes('super')) {
    return {
      bg: 'bg-purple-950/70',
      text: 'text-purple-300',
      border: 'border-purple-600/60',
      label: 'Cat 5 / Super',
    };
  }
  if (catLower.includes('cat 4') || catLower.includes('category 4') || catLower.includes('extremely severe')) {
    return {
      bg: 'bg-rose-950/70',
      text: 'text-rose-300',
      border: 'border-rose-600/60',
      label: 'Cat 4 / Extr. Severe',
    };
  }
  if (catLower.includes('cat 3') || catLower.includes('category 3') || catLower.includes('very severe')) {
    return {
      bg: 'bg-orange-950/70',
      text: 'text-orange-300',
      border: 'border-orange-600/60',
      label: 'Cat 3 / Very Severe',
    };
  }
  if (catLower.includes('cat 2') || catLower.includes('category 2') || catLower.includes('severe cyclonic')) {
    return {
      bg: 'bg-amber-950/70',
      text: 'text-amber-300',
      border: 'border-amber-600/60',
      label: 'Cat 2 / Severe CS',
    };
  }
  if (catLower.includes('cat 1') || catLower.includes('category 1') || catLower.includes('cyclonic storm')) {
    return {
      bg: 'bg-yellow-950/70',
      text: 'text-yellow-300',
      border: 'border-yellow-600/60',
      label: 'Cat 1 / CS',
    };
  }
  if (catLower.includes('storm')) {
    return {
      bg: 'bg-emerald-950/70',
      text: 'text-emerald-300',
      border: 'border-emerald-600/60',
      label: 'Tropical Storm',
    };
  }
  return {
    bg: 'bg-sky-950/70',
    text: 'text-sky-300',
    border: 'border-sky-600/60',
    label: 'Tropical Dep.',
  };
}

export function formatIsoDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    });
  } catch {
    return isoString;
  }
}
