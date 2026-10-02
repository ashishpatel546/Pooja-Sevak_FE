'use client';

import { useSyncExternalStore } from 'react';
import type { Coordinates } from './types';

/** The place a customer wants pujas for. Persisted per browser. */
export type SavedLocation = {
  label: string;
  lat: number;
  lng: number;
  address_id?: string;
  /** 'gps' when taken from the device; the UI shows a translated label for it. */
  kind?: 'gps';
};

const KEY = 'puja_location';
const EVENT = 'puja-location-change';

/**
 * Cities with real coordinates for quick selection. We are launching in Lucknow.
 * `name` is stored and sent to the API; `name_hi` is for display (use pick()).
 */
export const QUICK_CITIES: { name: string; name_hi: string; lat: number; lng: number; live: boolean }[] = [
  { name: 'Lucknow', name_hi: 'लखनऊ', lat: 26.8467, lng: 80.9462, live: true },
  { name: 'Varanasi', name_hi: 'वाराणसी', lat: 25.3176, lng: 82.9739, live: false },
  { name: 'Ayodhya', name_hi: 'अयोध्या', lat: 26.7922, lng: 82.1998, live: false },
  { name: 'Prayagraj', name_hi: 'प्रयागराज', lat: 25.4358, lng: 81.8463, live: false },
  { name: 'Kanpur', name_hi: 'कानपुर', lat: 26.4499, lng: 80.3319, live: false },
];

/** Quick city whose English or Hindi name matches `text` (case-insensitive). */
export function findQuickCity(text: string | null | undefined) {
  const needle = (text ?? '').trim().toLowerCase();
  if (!needle) return undefined;
  return QUICK_CITIES.find((c) => c.name.toLowerCase() === needle || c.name_hi === needle);
}

// In-memory fallback when localStorage is unavailable (private mode, blocked storage).
let memory: SavedLocation | null = null;
let cacheRaw: string | null | undefined;
let cacheValue: SavedLocation | null = null;

function parse(raw: string | null): SavedLocation | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<SavedLocation>;
    const lat = Number(v.lat);
    const lng = Number(v.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || typeof v.label !== 'string') return null;
    return {
      label: v.label,
      lat,
      lng,
      ...(v.address_id ? { address_id: v.address_id } : {}),
      ...(v.kind === 'gps' ? { kind: 'gps' as const } : {}),
    };
  } catch {
    return null;
  }
}

export function readLocation(): SavedLocation | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return memory;
  }
  if (raw === null && memory) return memory;
  if (raw === cacheRaw) return cacheValue;
  cacheRaw = raw;
  cacheValue = parse(raw);
  return cacheValue;
}

export function saveLocation(loc: SavedLocation) {
  memory = loc;
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
  } catch {
    /* storage unavailable — keep the in-memory copy */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearLocation() {
  memory = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

/** Reactive saved location (null on the server and when none is chosen). */
export function useSavedLocation(): SavedLocation | null {
  return useSyncExternalStore(subscribe, readLocation, () => null);
}

export type LocationErrorCode = 'unsupported' | 'denied' | 'timeout' | 'unavailable';

/**
 * Geolocation failure. `code` maps to the 'customer' message
 * `location.error.<code>`; `message` is an English fallback.
 */
export class LocationError extends Error {
  constructor(public code: LocationErrorCode) {
    super(
      {
        unsupported: 'Your browser cannot share location. Pick a city below instead.',
        denied:
          'Location permission was denied. Allow location for this site in your browser settings, or pick a city below.',
        timeout: 'Finding your location took too long. Please try again, or pick a city below.',
        unavailable: 'We could not find your location right now. Pick a city below instead.',
      }[code],
    );
    this.name = 'LocationError';
  }
}

/** Browser geolocation as a promise. Rejects with a LocationError the UI translates. */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new LocationError('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject(new LocationError('denied'));
        else if (err.code === err.TIMEOUT) reject(new LocationError('timeout'));
        else reject(new LocationError('unavailable'));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}
