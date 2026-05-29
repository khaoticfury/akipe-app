"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Navigation,
  Car,
  Footprints,
  ChevronRight,
  Star,
  Heart,
  LocateFixed,
  Crosshair,
} from "lucide-react";
import { Restaurant } from "../types/restaurant";
import { loadGoogleMaps } from "../utils/loadScript";
import { handleGeolocationError } from "../utils/geolocationErrorHandler";
import { useTheme } from "../contexts/ThemeContext";

interface EnhancedLimaMapProps {
  restaurants: Restaurant[];
  selectedRadius: number | null;
  userLocation: { latitude: number; longitude: number } | null;
  onRestaurantClick?: (restaurant: Restaurant) => void;
  fixedLocation?: { lat: number; lng: number } | null;
  locationSource?: "gps" | "manual" | "address" | null;
  routeRestaurant?: Restaurant | null;
  travelMode?: "walking" | "driving" | null;
  onClearRoute?: () => void;
  favoriteRestaurantIds?: string[];
  onFavoriteClick?: (restaurantId: string) => void;
}

type TravelMode = "walking" | "driving";
type UserMarkerState = "idle" | "dragA" | "dragB" | "walkA" | "walkB" | "car";

// Muestra todos los restaurantes cargados por la app como portal dots.
// Si luego hay demasiados, puedes bajarlo a 80 o 120 por performance.
const MAX_AKIPE_DOTS = 9999;
const FERXXO_GHOST_ICON_URL = "/ferxxo-ghost.png";

const GOOGLE_MAP_LIGHT_STYLE: any[] = [
  // Modo claro sin "grid": ocultamos calles locales/lotes y dejamos solo vías principales.
  { elementType: "geometry", stylers: [{ color: "#F8FAFC" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 2 }] },

  // Apaga líneas de distritos/lotes que parecen cuadrícula.
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.country", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.province", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", elementType: "all", stylers: [{ visibility: "off" }] },

  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#F8FAFC" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#F6F8FB" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#EEF8F1" }] },

  // POIs nativos visibles como capa base.
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#EEF5F1" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "on" }, { saturation: -12 }, { lightness: 8 }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ visibility: "on" }, { color: "#64748B" }] },
  { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ visibility: "on" }, { color: "#FFFFFF" }, { weight: 2 }] },

  { featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "poi.business", elementType: "labels.icon", stylers: [{ visibility: "on" }, { saturation: -8 }, { lightness: 4 }] },
  { featureType: "poi.business", elementType: "labels.text.fill", stylers: [{ visibility: "on" }, { color: "#475569" }] },
  { featureType: "poi.business", elementType: "labels.text.stroke", stylers: [{ visibility: "on" }, { color: "#FFFFFF" }, { weight: 2 }] },

  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#D8F0DF" }] },

  // La clave: ocultar road.local. Es lo que generaba la malla/cuadrícula blanca.
  { featureType: "road.local", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },

  // Solo vías útiles visibles.
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#64748B" }] },
  { featureType: "road.arterial", elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 2 }] },

  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#EDF3FA" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 2 }] },

  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#E5ECF3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#BFE8F6" }] },
];

const GOOGLE_MAP_DARK_STYLE: any[] = [
  // POIs nativos de Google visibles como capa base
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "on" }, { saturation: -22 }, { lightness: 4 }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ visibility: "on" }, { color: "#CBD5E1" }] },
  { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ visibility: "on" }, { color: "#020617" }] },

  // Restaurantes/negocios nativos de Google visibles
  { featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "poi.business", elementType: "labels.icon", stylers: [{ visibility: "on" }, { saturation: -20 }, { lightness: 8 }] },
  { featureType: "poi.business", elementType: "labels.text.fill", stylers: [{ visibility: "on" }, { color: "#E2E8F0" }] },
  { featureType: "poi.business", elementType: "labels.text.stroke", stylers: [{ visibility: "on" }, { color: "#020617" }] },

  { elementType: "geometry", stylers: [{ color: "#111827" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#CBD5E1" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#020617" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#102018" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#172033" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#12351F" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1F2937" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0F172A" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#273244" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#111827" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1E293B" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0B2533" }] },
];

const GOOGLE_MAP_FERXXO_STYLE: any[] = [
  // Ferxxo clean map: neón oscuro sin cuadrículas fuertes.
  { elementType: "geometry", stylers: [{ color: "#06130F" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#BDFDD6" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#03100C" }, { weight: 2 }] },

  // Quitamos líneas administrativas y lotes que generan efecto de cuadrícula.
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", elementType: "geometry", stylers: [{ visibility: "off" }] },

  // POIs nativos visibles, pero suaves, para que no compitan con los pins Ferxxo.
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#092016" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "on" }, { hue: "#00FF66" }, { saturation: 6 }, { lightness: -8 }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ visibility: "on" }, { color: "#94F8B8" }] },
  { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ visibility: "on" }, { color: "#03100C" }] },

  { featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "poi.business", elementType: "labels.icon", stylers: [{ visibility: "on" }, { hue: "#00FF66" }, { saturation: 10 }, { lightness: -12 }] },
  { featureType: "poi.business", elementType: "labels.text.fill", stylers: [{ visibility: "on" }, { color: "#BDFDD6" }] },
  { featureType: "poi.business", elementType: "labels.text.stroke", stylers: [{ visibility: "on" }, { color: "#03100C" }] },

  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0B2B19" }] },

  // Calles más orgánicas: sin stroke negro para que no se vea como malla/cuadriculado.
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#123227" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#A7F3C1" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#03100C" }, { weight: 2 }] },

  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#0D241B" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#153A2E" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1A5140" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },

  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#0D2A21" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#04272A" }] },
];

const getGoogleMapThemeOptions = (theme: string) => {
  if (theme === "ferxxo") {
    return {
      styles: GOOGLE_MAP_FERXXO_STYLE,
      backgroundColor: "#06130F",
      clickableIcons: true,
    };
  }

  if (theme === "dark") {
    return {
      styles: GOOGLE_MAP_DARK_STYLE,
      backgroundColor: "#020617",
      clickableIcons: true,
    };
  }

  return {
    styles: GOOGLE_MAP_LIGHT_STYLE,
    backgroundColor: "#F8FAFC",
    clickableIcons: true,
  };
};

const isCaletaRestaurant = (restaurant?: Restaurant | null) => {
  if (!restaurant) return false;

  const rawRestaurant = restaurant as any;
  const searchableValues = [
    rawRestaurant.is_hidden,
    rawRestaurant.isHidden,
    rawRestaurant.hidden_gem,
    rawRestaurant.hiddenGem,
    rawRestaurant.caleta,
    rawRestaurant.is_caleta,
    rawRestaurant.isCaleta,
    rawRestaurant.secret,
    rawRestaurant.is_secret,
    rawRestaurant.isSecret,
    rawRestaurant.special_tag,
    rawRestaurant.specialTag,
    restaurant.category,
    restaurant.type_of_cuisine,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    rawRestaurant.is_hidden === true ||
    rawRestaurant.isHidden === true ||
    rawRestaurant.hidden_gem === true ||
    rawRestaurant.hiddenGem === true ||
    rawRestaurant.caleta === true ||
    rawRestaurant.is_caleta === true ||
    rawRestaurant.isCaleta === true ||
    searchableValues.includes("caleta") ||
    searchableValues.includes("hidden") ||
    searchableValues.includes("secreto") ||
    searchableValues.includes("secret") ||
    searchableValues.includes("hueco")
  );
};

const getPortalVisualByRestaurant = (restaurant?: Restaurant | null) => {
  const rating = restaurant?.rating || 0;

  if (isCaletaRestaurant(restaurant)) {
    return {
      base: "#EF4444",
      selected: "#FF1744",
      halo: "#FBBF24",
      center: "#FFFFFF",
      label: "Caleta",
    };
  }

  if (rating > 0 && rating <= 2) {
    return {
      base: "#38BDF8",
      selected: "#0EA5E9",
      halo: "#7DD3FC",
      center: "#E0F2FE",
      label: "Portal azul",
    };
  }

  if (rating > 2 && rating <= 3) {
    return {
      base: "#A855F7",
      selected: "#9333EA",
      halo: "#D8B4FE",
      center: "#F3E8FF",
      label: "Portal morado",
    };
  }

  return {
    // Antes era amarillo/dorado y se perdía en modo claro.
    // Lo movemos a cobre/naranja premium: sigue sintiéndose "portal alto",
    // pero contrasta bastante mejor sobre mapa blanco.
    base: "#D97706",
    selected: "#EA580C",
    halo: "#FDBA74",
    center: "#FFF7ED",
    label: "Portal cobre",
  };
};

const createPortalDotSvg = ({
  restaurant,
  selected = false,
  isDark = false,
  muted = false,
}: {
  restaurant?: Restaurant | null;
  selected?: boolean;
  isDark?: boolean;
  muted?: boolean;
}) => {
  const portal = getPortalVisualByRestaurant(restaurant);

  const isCaleta = isCaletaRestaurant(restaurant);
  const dotColor = muted ? (isDark ? "#64748B" : "#9CA3AF") : selected ? portal.selected : portal.base;

  // En modo claro el dorado se perdía. Para el seleccionado usamos
  // contraste editorial: aro oscuro + halo naranja/dorado + núcleo brillante.
  const selectedRing = isCaleta ? "#FF1744" : isDark ? "#FFFFFF" : "#111827";
  const selectedHalo = isCaleta ? "#FBBF24" : "#FF7A00";
  const selectedCore = isCaleta ? "#FFFFFF" : "#FFF7ED";

  const strokeColor = isDark ? "#0F172A" : "#334155";
  const coreColor = selected ? selectedCore : dotColor;
  const ringColor = selected ? selectedRing : strokeColor;
  const haloColor = selected ? selectedHalo : portal.halo;

  return `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="portalShadow" x="-90%" y="-90%" width="280%" height="280%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.2" flood-color="${selected ? haloColor : dotColor}" flood-opacity="${selected ? "0.60" : "0.22"}"/>
          <feDropShadow dx="0" dy="9" stdDeviation="8" flood-color="#000000" flood-opacity="${isDark ? "0.36" : "0.20"}"/>
        </filter>

        <radialGradient id="portalHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${haloColor}" stop-opacity="${selected ? "0.44" : "0.20"}"/>
          <stop offset="52%" stop-color="${haloColor}" stop-opacity="${selected ? "0.20" : "0.085"}"/>
          <stop offset="100%" stop-color="${haloColor}" stop-opacity="0"/>
        </radialGradient>

        <radialGradient id="portalCore" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stop-color="${selected ? selectedCore : "#FFFFFF"}" stop-opacity="${selected ? "1" : "0.62"}"/>
          <stop offset="46%" stop-color="${selected ? dotColor : coreColor}" stop-opacity="0.98"/>
          <stop offset="100%" stop-color="${dotColor}" stop-opacity="0.92"/>
        </radialGradient>
      </defs>

      ${
        selected
          ? `
        <circle cx="32" cy="32" r="29" fill="url(#portalHalo)"/>
        <circle cx="32" cy="32" r="20" fill="${haloColor}" opacity="0.12"/>
        <circle cx="32" cy="32" r="13" fill="${haloColor}" opacity="0.16"/>
      `
          : `
        <circle cx="32" cy="32" r="16" fill="url(#portalHalo)"/>
      `
      }

      <circle
        cx="32"
        cy="32"
        r="${selected ? 8.4 : 5.4}"
        fill="url(#portalCore)"
        stroke="${ringColor}"
        stroke-width="${selected ? 3.2 : 2.2}"
        filter="url(#portalShadow)"
      />

      ${
        selected
          ? `
        <circle
          cx="32"
          cy="32"
          r="14.5"
          fill="none"
          stroke="${haloColor}"
          stroke-width="1.7"
          opacity="0.72"
        />
        <circle
          cx="32"
          cy="32"
          r="22.5"
          fill="none"
          stroke="${haloColor}"
          stroke-width="1"
          opacity="0.30"
        />
      `
          : ""
      }

      ${
        isCaleta
          ? `
        <path
          d="M32 22.2 L34.1 28.8 L41.1 28.9 L35.5 32.9 L37.5 39.6 L32 35.5 L26.5 39.6 L28.5 32.9 L22.9 28.9 L29.9 28.8 Z"
          fill="${selected ? "#FF1744" : "#FFFFFF"}"
          opacity="${selected ? "0.94" : "0.72"}"
          transform="scale(${selected ? "0.50" : "0.38"}) translate(${selected ? "32 32" : "50 50"})"
        />
      `
          : ""
      }
    </svg>
  `;
};

const getPortalDotIcon = (
  googleMaps: any,
  restaurant?: Restaurant | null,
  selected = false,
  isDark = false,
  muted = false
) => ({
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    createPortalDotSvg({ restaurant, selected, isDark, muted })
  )}`,
  // Los portal dots van más grandes para "reemplazar" visualmente
  // a los iconos nativos de Google, que quedan como referencia secundaria.
  scaledSize: new googleMaps.Size(selected ? 78 : 68, selected ? 78 : 68),
  anchor: new googleMaps.Point(selected ? 39 : 34, selected ? 39 : 34),
});


const createFerxxoGhostMarkup = (ghostSize: number) => `
  <g transform="translate(${-ghostSize * 0.02} ${-ghostSize * 0.01}) scale(${ghostSize / 96})">
    <path
      d="M13 61.5c5.4-9.2 14.5-14.2 22.9-12.5-4.7-7-3.4-17.3 3.5-24.6C49.2 14 65.8 11.8 78.2 20.2c12.5 8.5 12.2 24.7 2.5 37.8C68.9 73.8 46.9 78.7 29.2 68.7c-4.9 4.7-11.8 6.7-19 5.7 5.1-2.7 6.5-7.4 2.8-12.9Z"
      fill="#06130F"
    />
    <path
      d="M55.6 43.2c-5.8 1.3-10.8 5.2-13.8 10.9 6.2-3.8 12.8-4.4 19.4-1.5 5.7 2.6 9.6 6.9 11.9 13.2 3.1-7.8 2.1-15-2.9-19.5-3.8-3.5-8.9-4.6-14.6-3.1Z"
      fill="#00C853"
    />
    <path
      d="M39.8 61.4c13.3 4.1 26.4 2.2 39.4-5.9-4.5 11.3-12.8 18.1-24.3 19.8-6.5 1-11.9.1-16.1-2.5 4.8-1.9 7.2-4.3 7.1-7.2-.1-2.1-2.1-3.5-6.1-4.2Z"
      fill="#00C853"
    />
    <path d="M46.4 34.5c-2.8-.7-5.9 1.2-6.9 4.3-1 3.2.5 6.3 3.3 7 2.8.7 5.9-1.2 6.9-4.3 1-3.2-.5-6.3-3.3-7Z" fill="#00C853"/>
    <path d="M75.3 31.2c-2.9-.7-6.1 1.4-7.1 4.7-1 3.3.6 6.5 3.5 7.2 2.9.7 6.1-1.4 7.1-4.7 1-3.3-.6-6.5-3.5-7.2Z" fill="#00C853"/>
  </g>
`;

const createFerxxoGlassPinSvg = ({ selected = false }: { selected?: boolean }) => {
  const size = selected ? 86 : 68;
  const center = size / 2;
  const ghostSize = selected ? 42 : 34;
  const ghostX = center - ghostSize / 2;
  const ghostY = selected ? 17 : 14;
  const glowOpacity = selected ? "0.76" : "0.46";

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ferxxoGlow" x="-90%" y="-90%" width="280%" height="280%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#00C853" flood-opacity="${glowOpacity}"/>
          <feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#000000" flood-opacity="0.38"/>
        </filter>
        <radialGradient id="ferxxoHalo" cx="50%" cy="48%" r="54%">
          <stop offset="0%" stop-color="#00C853" stop-opacity="${selected ? "0.42" : "0.24"}"/>
          <stop offset="100%" stop-color="#00C853" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="ferxxoGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#B7FFD0" stop-opacity="0.95"/>
          <stop offset="45%" stop-color="#00C853" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#007A33" stop-opacity="0.38"/>
        </linearGradient>
      </defs>

      <circle cx="${center}" cy="${center}" r="${selected ? "39" : "30"}" fill="url(#ferxxoHalo)"/>
      <circle cx="${center}" cy="${center}" r="${selected ? "25" : "20"}" fill="url(#ferxxoGlass)" stroke="#77FFA5" stroke-width="${selected ? "2.2" : "1.8"}" opacity="0.72" filter="url(#ferxxoGlow)"/>

      <g transform="translate(${ghostX} ${ghostY})">
        ${createFerxxoGhostMarkup(ghostSize)}
      </g>

      <path
        d="M ${center - 7} ${size - 21} Q ${center} ${size - 8} ${center + 7} ${size - 21}"
        fill="#00C853"
        opacity="0.92"
        filter="url(#ferxxoGlow)"
      />

      <ellipse cx="${center}" cy="${size - 8}" rx="${selected ? "14" : "10"}" ry="${selected ? "4.4" : "3.4"}" fill="#00C853" opacity="${selected ? "0.46" : "0.28"}"/>
    </svg>
  `;
};

const getFerxxoGlassPinIcon = (googleMaps: any, selected = false) => ({
  url: FERXXO_GHOST_ICON_URL,
  scaledSize: selected ? new googleMaps.Size(74, 74) : new googleMaps.Size(60, 60),
  anchor: selected ? new googleMaps.Point(37, 68) : new googleMaps.Point(30, 55),
});



const GoogleMapsCompactIcon = () => (
  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.16)]">
    <svg width="28" height="28" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#1A73E8" d="M24 4C16.3 4 10 10.2 10 17.9c0 10.4 14 26.1 14 26.1s14-15.7 14-26.1C38 10.2 31.7 4 24 4z" />
      <path fill="#34A853" d="M13.9 8.3 23.5 18l-7.8 7.8C12.1 21.2 9.9 16.2 13.9 8.3z" />
      <path fill="#FBBC04" d="M24.5 18 34 8.6c3.8 7.6 1.8 12.5-1.8 17.1L24.5 18z" />
      <path fill="#EA4335" d="M24 4c3.9 0 7.3 1.6 9.8 4.2L24.5 18 14 8.4C16.5 5.7 20 4 24 4z" />
      <circle cx="24" cy="18" r="5.6" fill="white" />
      <circle cx="24" cy="18" r="2.9" fill="#1A73E8" />
    </svg>
  </div>
);

const WazeCompactIcon = () => (
  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#33CCFF] shadow-[0_8px_18px_rgba(14,165,233,0.26)]">
    <svg width="29" height="29" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M37.9 30.3c3-3.1 4.6-7.1 4.6-11.2C42.5 10.8 35 4 25.7 4 16.3 4 8.8 10.8 8.8 19.1c0 2.7.8 5.3 2.3 7.5L6 34.2c-.8 1.2.4 2.7 1.8 2.2l9.1-3.2c2.6 1.2 5.6 1.9 8.8 1.9 1.5 0 3-.2 4.4-.5" fill="#FFFFFF"/>
      <path d="M37.9 30.3c3-3.1 4.6-7.1 4.6-11.2C42.5 10.8 35 4 25.7 4 16.3 4 8.8 10.8 8.8 19.1c0 2.7.8 5.3 2.3 7.5L6 34.2c-.8 1.2.4 2.7 1.8 2.2l9.1-3.2c2.6 1.2 5.6 1.9 8.8 1.9 1.5 0 3-.2 4.4-.5" fill="none" stroke="#1B2430" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="19" cy="19" r="2.2" fill="#1B2430" />
      <circle cx="31" cy="19" r="2.2" fill="#1B2430" />
      <path d="M19.5 26c3.2 2.6 8.2 2.6 11.4 0" fill="none" stroke="#1B2430" stroke-width="2.3" stroke-linecap="round" />
      <circle cx="17" cy="38" r="3.7" fill="#1B2430" />
      <circle cx="35" cy="38" r="3.7" fill="#1B2430" />
    </svg>
  </div>
);


const createUserSvg = (state: UserMarkerState = "idle") => {
  if (state === "car") {
    return `
      <svg width="58" height="48" viewBox="0 0 58 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="carShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.36"/>
          </filter>
          <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#111827"/>
            <stop offset="50%" stop-color="#020617"/>
            <stop offset="100%" stop-color="#1F2937"/>
          </linearGradient>
          <linearGradient id="windshield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#BAE6FD"/>
            <stop offset="100%" stop-color="#2563EB"/>
          </linearGradient>
        </defs>

        <ellipse cx="29" cy="39" rx="17" ry="5" fill="#000000" opacity="0.16"/>
        <g filter="url(#carShadow)">
          <path d="M9 29 Q13 20 22 18 L28 12 Q35 9 42 17 Q49 19 52 28 Q53 32 49 33 H12 Q8 33 9 29Z"
            fill="url(#carBody)" stroke="#0F172A" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M24 18 L29 13 Q34 12 39 18 Z" fill="url(#windshield)" opacity="0.92"/>
          <path d="M12 28 H50" stroke="#374151" stroke-width="1.2" opacity="0.9"/>
          <circle cx="18" cy="33" r="5.2" fill="#111827" stroke="#E5E7EB" stroke-width="1.4"/>
          <circle cx="40" cy="33" r="5.2" fill="#111827" stroke="#E5E7EB" stroke-width="1.4"/>
          <circle cx="18" cy="33" r="2.1" fill="#CBD5E1"/>
          <circle cx="40" cy="33" r="2.1" fill="#CBD5E1"/>
        </g>
      </svg>
    `;
  }

  const isWalkA = state === "walkA";
  const isWalkB = state === "walkB";
  const isDragA = state === "dragA";
  const isDragB = state === "dragB";

  const bodyRotation = isDragA
    ? "-9 23 31"
    : isDragB
    ? "9 23 31"
    : isWalkA
    ? "-3 23 31"
    : isWalkB
    ? "3 23 31"
    : "0 23 31";

  const headX = isDragA ? 20.7 : isDragB ? 23.3 : 22;

  const legLeft = isDragA
    ? "M19 38 Q16 44 17 50"
    : isDragB
    ? "M19 38 Q20 44 22 50"
    : isWalkA
    ? "M19 38 Q15 43 14 50"
    : isWalkB
    ? "M19 38 Q20 44 22 50"
    : "M19 38 Q18 44 18.5 50";

  const legRight = isDragA
    ? "M25 38 Q25 44 28 50"
    : isDragB
    ? "M25 38 Q28 44 27 50"
    : isWalkA
    ? "M25 38 Q24 44 22 50"
    : isWalkB
    ? "M25 38 Q30 43 31 50"
    : "M25 38 Q26 44 25.5 50";

  const armLeft = isDragA
    ? "M15 25 Q11 29 13 36"
    : isDragB
    ? "M15 25 Q15 31 18 36"
    : isWalkA
    ? "M15 25 Q11 29 12 35"
    : isWalkB
    ? "M15 25 Q15 30 17 35"
    : "M15 25 Q13 29 14 34";

  const armRight = isDragA
    ? "M29 25 Q31 30 28 36"
    : isDragB
    ? "M29 25 Q34 29 32 36"
    : isWalkA
    ? "M29 25 Q29 30 27 35"
    : isWalkB
    ? "M29 25 Q33 29 32 35"
    : "M29 25 Q31 29 30 34";

  return `
    <svg width="46" height="58" viewBox="0 0 46 58" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="pegShadow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="2.8" stdDeviation="2.4" flood-color="#000000" flood-opacity="0.32"/>
        </filter>
        <linearGradient id="pegBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFE066"/>
          <stop offset="55%" stop-color="#FFC83D"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
      </defs>

      <ellipse cx="23" cy="51" rx="12" ry="4.4" fill="#000000" opacity="0.16"/>

      <g filter="url(#pegShadow)">
        <g transform="rotate(${bodyRotation})">
          <circle cx="${headX}" cy="14" r="7.3" fill="url(#pegBody)" stroke="#9A6A00" stroke-width="1.45"/>
          <path d="M17 22 Q17 19.5 19.5 19.5 H26.5 Q29 19.5 29 22 V34 Q29 37.8 25.5 38 H20.5 Q17 37.8 17 34 Z"
            fill="url(#pegBody)" stroke="#9A6A00" stroke-width="1.55" stroke-linejoin="round"/>
          <path d="${armLeft}" fill="none" stroke="#9A6A00" stroke-width="3.1" stroke-linecap="round"/>
          <path d="${armRight}" fill="none" stroke="#9A6A00" stroke-width="3.1" stroke-linecap="round"/>
          <path d="${legLeft}" fill="none" stroke="#9A6A00" stroke-width="3.1" stroke-linecap="round"/>
          <path d="${legRight}" fill="none" stroke="#9A6A00" stroke-width="3.1" stroke-linecap="round"/>
          <circle cx="${headX - 2.2}" cy="13.2" r="0.8" fill="#7C4A00"/>
          <circle cx="${headX + 2.2}" cy="13.2" r="0.8" fill="#7C4A00"/>
          <path d="M${headX - 2.4} 16 Q${headX} 17.3 ${headX + 2.4} 16" fill="none" stroke="#7C4A00" stroke-width="1" stroke-linecap="round"/>
        </g>
      </g>
    </svg>
  `;
};

const getUserMarkerIcon = (googleMaps: any, state: UserMarkerState = "idle") => ({
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createUserSvg(state))}`,
  scaledSize:
    state === "car" ? new googleMaps.Size(58, 48) : new googleMaps.Size(46, 58),
  anchor:
    state === "car" ? new googleMaps.Point(29, 35) : new googleMaps.Point(23, 51),
});

const getRestaurantImage = (restaurant: Restaurant) => {
  return (
    (restaurant as any).image_url ||
    (restaurant as any).imageUrl ||
    (restaurant as any).photo_url ||
    (restaurant as any).photoUrl ||
    ""
  );
};

const formatRating = (rating?: number) => {
  if (!rating || rating <= 0) return null;
  return Number(rating).toFixed(1);
};

const formatCuisine = (restaurant: Restaurant) => {
  return restaurant.type_of_cuisine || "Restaurante";
};

const getDistanceMeters = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) => {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const isRestaurantInsideRadius = (
  restaurant: Restaurant,
  centerLocation: { lat: number; lng: number } | null,
  selectedRadius: number | null
) => {
  if (!centerLocation || !selectedRadius) return true;

  const distance = getDistanceMeters(centerLocation, {
    lat: restaurant.gps_coordinates.latitude,
    lng: restaurant.gps_coordinates.longitude,
  });

  return distance <= selectedRadius * 1000;
};


const EnhancedLimaMap: React.FC<EnhancedLimaMapProps> = ({
  restaurants,
  selectedRadius,
  userLocation,
  fixedLocation: propFixedLocation,
  locationSource: propLocationSource,
  routeRestaurant,
  travelMode,
  onClearRoute,
  favoriteRestaurantIds = [],
  onFavoriteClick,
}) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === "dark";
  const isFerxxo = actualTheme === "ferxxo";

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const restaurantMarkersByIdRef = useRef<Record<string, any>>({});
  const restaurantByIdRef = useRef<Record<string, Restaurant>>({});
  const overlayViewRef = useRef<any>(null);
  const overlayProjectionRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const googlePoiSearchTimeoutRef = useRef<number | null>(null);
  const lastGooglePoiSearchKeyRef = useRef<string>("");
  const watchIdRef = useRef<number | null>(null);
  const routeMotionIntervalRef = useRef<number | null>(null);
  const dragAnimationIntervalRef = useRef<number | null>(null);

  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [showLocationControls, setShowLocationControls] = useState(false);
  const [hasInitialZoom, setHasInitialZoom] = useState(false);
  const [fixedLocation, setFixedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [popupRestaurant, setPopupRestaurant] = useState<Restaurant | null>(null);
  const [popupPoint, setPopupPoint] = useState<{ x: number; y: number } | null>(null);
  const [googlePoiRestaurants, setGooglePoiRestaurants] = useState<Restaurant[]>([]);
  const [internalRouteRestaurant, setInternalRouteRestaurant] = useState<Restaurant | null>(null);
  const [internalTravelMode, setInternalTravelMode] = useState<TravelMode | null>(null);

  const activeRouteRestaurant = routeRestaurant || internalRouteRestaurant;
  const activeTravelMode = travelMode || internalTravelMode;

  const centerLocation =
    propFixedLocation || manualLocation
      ? propFixedLocation || manualLocation
      : userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude }
      : null;

  const getClampedPopupPoint = (point: { x: number; y: number }) => {
    const mapWidth = mapRef.current?.clientWidth || window.innerWidth || 390;
    const mapHeight = mapRef.current?.clientHeight || window.innerHeight || 720;

    const halfPopupWidth = Math.min(195, Math.max(160, (mapWidth - 32) / 2));
    const x = Math.min(
      Math.max(point.x, halfPopupWidth + 12),
      mapWidth - halfPopupWidth - 12
    );

    // El popup nace debajo del portal dot, pero se limita para no cortarse.
    const desiredTop = point.y + 52;
    const maxTop = Math.max(105, mapHeight - 250);
    const y = Math.min(Math.max(desiredTop, 86), maxTop);

    return { x, y };
  };

  const updatePopupScreenPoint = (restaurant: Restaurant | null = popupRestaurant) => {
    if (!restaurant || !window.google?.maps || !overlayProjectionRef.current) {
      setPopupPoint(null);
      return;
    }

    const latLng = new window.google.maps.LatLng(
      restaurant.gps_coordinates.latitude,
      restaurant.gps_coordinates.longitude
    );

    const point = overlayProjectionRef.current.fromLatLngToContainerPixel(latLng);

    if (!point) return;

    setPopupPoint(getClampedPopupPoint({ x: point.x, y: point.y }));
  };

  const convertGooglePlaceToRestaurant = (place: any): Restaurant | null => {
    if (!place?.geometry?.location) return null;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const types: string[] = place.types || [];

    const photoUrl =
      place.photos && place.photos.length > 0 && typeof place.photos[0].getUrl === "function"
        ? place.photos[0].getUrl({
            maxWidth: 640,
            maxHeight: 420,
          })
        : "";

    return {
      id: place.place_id || `google-place-${Date.now()}`,
      name: place.name || "Restaurante",
      address:
        place.formatted_address ||
        place.vicinity ||
        place.name ||
        "Dirección no disponible",
      image_url: photoUrl,
      photo_url: photoUrl,
      district: "Lima",
      type_of_cuisine: types.includes("cafe")
        ? "Cafetería"
        : types.includes("bakery")
        ? "Panadería"
        : types.includes("bar")
        ? "Bar"
        : types.includes("meal_takeaway")
        ? "Comida rápida"
        : "Restaurante",
      gps_coordinates: {
        latitude: lat,
        longitude: lng,
      },
      opening_hours:
        place.opening_hours?.weekday_text?.join(" / ") || "Horario no disponible",
      rating: place.rating || 0,
      price_range: {
        min: 0,
        max: 0,
        currency: "S/",
      },
      category: "local",
      date_added: new Date().toISOString(),
      wait_time: "No disponible",
      group_friendly: {
        solo: true,
        couple: true,
        family: true,
        large_group: true,
      },
    };
  };

  const fetchGooglePoiRestaurantsForPortalDots = () => {
    if (!mapInstance.current || !window.google?.maps?.places) return;

    if (!placesServiceRef.current) {
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        mapInstance.current
      );
    }

    const center = mapInstance.current.getCenter();
    if (!center) return;

    const zoom = mapInstance.current.getZoom?.() || 15;
    const lat = Number(center.lat().toFixed(3));
    const lng = Number(center.lng().toFixed(3));
    const searchKey = `${lat},${lng},${zoom}`;

    if (lastGooglePoiSearchKeyRef.current === searchKey) return;
    lastGooglePoiSearchKeyRef.current = searchKey;

    const baseRequest = {
      location: center,
      radius: zoom >= 16 ? 1300 : zoom >= 15 ? 2200 : 3500,
    };

    const typesToSearch = ["restaurant", "cafe", "bar"];
    const collected = new Map<string, Restaurant>();
    let completed = 0;

    const finishSearch = () => {
      completed += 1;

      if (completed < typesToSearch.length) return;

      const nextRestaurants = Array.from(collected.values());

      setGooglePoiRestaurants((currentRestaurants) => {
        const merged = new Map<string, Restaurant>();

        currentRestaurants.forEach((restaurant) => {
          merged.set(restaurant.id, restaurant);
        });

        nextRestaurants.forEach((restaurant) => {
          merged.set(restaurant.id, restaurant);
        });

        return Array.from(merged.values()).slice(-120);
      });
    };

    typesToSearch.forEach((type) => {
      placesServiceRef.current.nearbySearch(
        {
          ...baseRequest,
          type,
        },
        (results: any[] | null, status: any) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            results.forEach((place) => {
              const restaurant = convertGooglePlaceToRestaurant(place);

              if (restaurant) {
                restaurant.id = `google-${restaurant.id}`;
                collected.set(restaurant.id, restaurant);
              }
            });
          }

          finishSearch();
        }
      );
    });
  };

  const scheduleGooglePoiPortalDotSearch = () => {
    if (googlePoiSearchTimeoutRef.current !== null) {
      window.clearTimeout(googlePoiSearchTimeoutRef.current);
    }

    googlePoiSearchTimeoutRef.current = window.setTimeout(() => {
      fetchGooglePoiRestaurantsForPortalDots();
    }, 450);
  };

  const clearRouteMotionAnimation = () => {
    if (routeMotionIntervalRef.current !== null) {
      window.clearInterval(routeMotionIntervalRef.current);
      routeMotionIntervalRef.current = null;
    }
  };

  const clearDragAnimation = () => {
    if (dragAnimationIntervalRef.current !== null) {
      window.clearInterval(dragAnimationIntervalRef.current);
      dragAnimationIntervalRef.current = null;
    }
  };

  const startUserDragAnimation = () => {
    clearRouteMotionAnimation();
    clearDragAnimation();

    if (!userMarkerRef.current || !window.google?.maps) return;

    const frames: UserMarkerState[] = ["dragA", "dragB"];
    let index = 0;

    setUserIcon(frames[index]);

    dragAnimationIntervalRef.current = window.setInterval(() => {
      index = index === 0 ? 1 : 0;
      setUserIcon(frames[index]);
    }, 145);
  };

  const setUserIcon = (state: UserMarkerState = "idle") => {
    if (userMarkerRef.current && window.google?.maps) {
      userMarkerRef.current.setIcon(getUserMarkerIcon(window.google.maps, state));
      userMarkerRef.current.setDraggable(true);
      userMarkerRef.current.setClickable(true);
      userMarkerRef.current.setZIndex(20000);
    }
  };

  const getRestingMarkerState = (): UserMarkerState => {
    if (activeTravelMode === "driving") return "car";
    if (activeTravelMode === "walking") return "walkA";
    return "idle";
  };

  const startRouteMotionAnimation = () => {
    clearRouteMotionAnimation();

    if (!userMarkerRef.current || !window.google?.maps) return;

    if (activeTravelMode === "walking") {
      const frames: UserMarkerState[] = ["walkA", "walkB"];
      let index = 0;

      setUserIcon(frames[index]);

      routeMotionIntervalRef.current = window.setInterval(() => {
        index = index === 0 ? 1 : 0;
        setUserIcon(frames[index]);
      }, 260);

      return;
    }

    if (activeTravelMode === "driving") {
      setUserIcon("car");
      return;
    }

    setUserIcon("idle");
  };

  const refreshMinimalDots = (selectedRestaurant: Restaurant | null) => {
    if (!window.google?.maps) return;

    Object.entries(restaurantMarkersByIdRef.current).forEach(([restaurantId, marker]) => {
      const isSelected = selectedRestaurant?.id === restaurantId;

      const restaurant = restaurantByIdRef.current[restaurantId];

      marker.setIcon(
        isFerxxo
          ? getFerxxoGlassPinIcon(window.google.maps, isSelected)
          : getPortalDotIcon(window.google.maps, restaurant, isSelected, isDark)
      );
      marker.setZIndex(isSelected ? 1200 : isFerxxo ? 700 : 850);
      marker.setOpacity(isSelected ? 1 : isFerxxo ? 0.94 : 0.98);
    });
  };

  const handleMarkerRouteSelect = (restaurant: Restaurant, mode: TravelMode) => {
    setPopupRestaurant(null);
          setPopupPoint(null);
    setInternalRouteRestaurant(restaurant);
    setInternalTravelMode(mode);

    if (mapInstance.current) {
      mapInstance.current.setOptions({
        draggable: true,
        gestureHandling: "greedy",
        scrollwheel: true,
        clickableIcons: true,
        disableDoubleClickZoom: false,
        keyboardShortcuts: true,
      });
    }

    setTimeout(() => {
      startRouteMotionAnimation();
    }, 50);
  };

  const handleClearRoute = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }

    clearRouteMotionAnimation();
    setUserIcon("idle");
    setInternalRouteRestaurant(null);
    setInternalTravelMode(null);
    setPopupRestaurant(null);
    setPopupPoint(null);

    if (onClearRoute) {
      onClearRoute();
    }
  };

  const reloadGoogleMaps = () => {
    setGoogleMapsLoaded(false);
    setLoadingError(null);

    setTimeout(() => {
      setGoogleMapsLoaded(true);
    }, 100);
  };

  const handleLocationAction = () => {
    if (fixedLocation || manualLocation) {
      const locationToUse = fixedLocation || manualLocation;

      if (locationToUse && mapInstance.current && userMarkerRef.current) {
        const pos = new window.google.maps.LatLng(
          locationToUse.lat,
          locationToUse.lng
        );

        userMarkerRef.current.setPosition(pos);
        setUserIcon(getRestingMarkerState());
        mapInstance.current.setCenter(pos);
        mapInstance.current.setZoom(17);
      }

      return;
    }

    if (!navigator.geolocation) {
      alert("La geolocalización no está disponible en este navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (mapInstance.current && userMarkerRef.current) {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          userMarkerRef.current.setPosition(pos);
          setUserIcon(getRestingMarkerState());
          mapInstance.current.setCenter(pos);
          mapInstance.current.setZoom(17);
        }
      },
      (error) => {
        const { errorMessage, errorCode } = handleGeolocationError(error);
        console.error("Error getting location:", errorMessage);

        if (errorCode === 3) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (mapInstance.current && userMarkerRef.current) {
                const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };

                userMarkerRef.current.setPosition(pos);
                setUserIcon(getRestingMarkerState());
                mapInstance.current.setCenter(pos);
                mapInstance.current.setZoom(17);
              }
            },
            (finalError) => {
              const { errorMessage: finalErrorMessage } =
                handleGeolocationError(finalError);
              alert(finalErrorMessage);
            },
            {
              enableHighAccuracy: false,
              maximumAge: 300000,
              timeout: 10000,
            }
          );

          return;
        }

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 60000,
      }
    );
  };

  const handleAddressSubmit = async () => {
    if (!addressInput.trim() || !window.google?.maps) {
      alert("Por favor ingresa una dirección válida.");
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode(
        { address: `${addressInput}, Lima, Peru` },
        (results: any, status: any) => {
          if (status === "OK" && results?.[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            const newLocation = { lat, lng };

            setManualLocation(newLocation);
            setFixedLocation(newLocation);
            clearDragAnimation();
            userMarkerRef.current?.setZIndex(20000);
            userMarkerRef.current?.setCursor?.("grab");
            setUserIcon(getRestingMarkerState());

            window.dispatchEvent(
              new CustomEvent("addressLocationUpdate", {
                detail: { latitude: lat, longitude: lng },
              })
            );

            if (mapInstance.current && userMarkerRef.current) {
              userMarkerRef.current.setPosition(newLocation);
              setUserIcon(getRestingMarkerState());
              mapInstance.current.setCenter(newLocation);
              mapInstance.current.setZoom(17);
            }

            setShowAddressInput(false);
            setAddressInput("");
            return;
          }

          alert(
            "No se pudo encontrar la dirección. Intenta con una dirección más específica."
          );
        }
      );
    } catch (error) {
      console.error("Error in handleAddressSubmit:", error);
      alert("Error al procesar la dirección. Por favor, intenta de nuevo.");
    }
  };

  const handleClearFixedLocation = () => {
    setFixedLocation(null);
    setManualLocation(null);

    window.dispatchEvent(new CustomEvent("clearFixedLocation"));

    if (userLocation && mapInstance.current && userMarkerRef.current) {
      const pos = {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      };

      userMarkerRef.current.setPosition(pos);
      setUserIcon(getRestingMarkerState());
      mapInstance.current.setCenter(pos);
      mapInstance.current.setZoom(16);
    }
  };

  useEffect(() => {
    const loadGoogleMapsAsync = async () => {
      try {
        setLoadingError(null);
        await loadGoogleMaps();
        setGoogleMapsLoaded(true);
      } catch (error) {
        console.error("Failed to load Google Maps:", error);
        setLoadingError(
          error instanceof Error ? error.message : "Failed to load Google Maps"
        );
      }
    };

    loadGoogleMapsAsync();
  }, []);

  useEffect(() => {
    if (googlePoiRestaurants.length === 0) return;

    window.dispatchEvent(
      new CustomEvent("nearbyRestaurantsUpdate", {
        detail: {
          restaurants: googlePoiRestaurants,
        },
      })
    );
  }, [googlePoiRestaurants]);


  useEffect(() => {
    if (!loadingError) return;

    const retryTimer = setTimeout(() => {
      setLoadingError(null);
      setGoogleMapsLoaded(false);

      setTimeout(() => {
        setGoogleMapsLoaded(true);
      }, 100);
    }, 2000);

    return () => clearTimeout(retryTimer);
  }, [loadingError]);

  useEffect(() => {
    return () => {
      clearRouteMotionAnimation();
      clearDragAnimation();

      if (googlePoiSearchTimeoutRef.current !== null) {
        window.clearTimeout(googlePoiSearchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!googleMapsLoaded || !window.google?.maps || !userMarkerRef.current) {
      return;
    }

    clearRouteMotionAnimation();

    if (!activeTravelMode) {
      setUserIcon("idle");
      return;
    }

    startRouteMotionAnimation();

    return () => {
      clearRouteMotionAnimation();
    };
  }, [activeTravelMode, googleMapsLoaded]);

  useEffect(() => {
    if (!googleMapsLoaded || !mapInstance.current) return;

    mapInstance.current.setOptions({
      ...getGoogleMapThemeOptions(actualTheme),
      clickableIcons: true,
      draggable: true,
      gestureHandling: "greedy",
      scrollwheel: true,
      disableDoubleClickZoom: false,
      keyboardShortcuts: true,
    });
  }, [actualTheme, googleMapsLoaded]);

  useEffect(() => {
    refreshMinimalDots(popupRestaurant);

    window.setTimeout(() => {
      updatePopupScreenPoint(popupRestaurant);
    }, 80);
  }, [popupRestaurant, googleMapsLoaded, isDark, isFerxxo]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("restaurantPopupStateChange", {
        detail: {
          open: Boolean(popupRestaurant),
        },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("restaurantPopupStateChange", {
          detail: {
            open: false,
          },
        })
      );
    };
  }, [popupRestaurant]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("routePillStateChange", {
        detail: {
          open: Boolean(activeRouteRestaurant && activeTravelMode),
        },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("routePillStateChange", {
          detail: {
            open: false,
          },
        })
      );
    };
  }, [activeRouteRestaurant, activeTravelMode]);





  useEffect(() => {
    if (
      !googleMapsLoaded ||
      !mapRef.current ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.Map
    ) {
      return;
    }

    try {
      if (!mapInstance.current) {
        const initialCenter = userLocation
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : { lat: -12.0464, lng: -77.0428 };

        const initialZoom = userLocation ? 16 : 12;
        const mapOptions: any = {
          center: initialCenter,
          zoom: initialZoom,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          draggable: true,
          scrollwheel: true,
          clickableIcons: true,
          disableDoubleClickZoom: false,
          keyboardShortcuts: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          ...getGoogleMapThemeOptions(actualTheme),
        };

        if (window.google.maps.ControlPosition) {
          mapOptions.zoomControlOptions = {
            position: window.google.maps.ControlPosition.RIGHT_CENTER,
          };
        }

        mapInstance.current = new window.google.maps.Map(mapRef.current, mapOptions);

        // Overlay invisible para convertir lat/lng del portal dot a posición en pantalla.
        const popupOverlay = new window.google.maps.OverlayView();
        popupOverlay.onAdd = () => {};
        popupOverlay.onRemove = () => {};
        popupOverlay.draw = () => {
          overlayProjectionRef.current = popupOverlay.getProjection();
          updatePopupScreenPoint();
        };
        popupOverlay.setMap(mapInstance.current);
        overlayViewRef.current = popupOverlay;

        mapInstance.current.addListener("dragstart", () => {
          setPopupRestaurant(null);
          window.dispatchEvent(new CustomEvent("mapInteractionStart"));
        });

        mapInstance.current.addListener("zoom_changed", () => {
          window.dispatchEvent(new CustomEvent("mapInteractionStart"));
        });

        mapInstance.current.addListener("dragend", () => {
          window.dispatchEvent(new CustomEvent("mapInteractionEnd"));
        });

        mapInstance.current.addListener("idle", () => {
          scheduleGooglePoiPortalDotSearch();
          updatePopupScreenPoint();

          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("mapInteractionEnd"));
          }, 100);
        });

        window.setTimeout(() => {
          scheduleGooglePoiPortalDotSearch();
        }, 650);

        mapInstance.current.addListener("click", (event: any) => {
          setShowLocationControls(false);

          if (event.placeId) {
            if (typeof event.stop === "function") {
              event.stop();
            }

            if (!placesServiceRef.current) {
              placesServiceRef.current = new window.google.maps.places.PlacesService(
                mapInstance.current
              );
            }

            placesServiceRef.current.getDetails(
              {
                placeId: event.placeId,
                fields: [
                  "place_id",
                  "name",
                  "formatted_address",
                  "vicinity",
                  "geometry",
                  "rating",
                  "types",
                  "opening_hours",
                  "photos",
                ],
              },
              (place: any, status: any) => {
                if (
                  status === window.google.maps.places.PlacesServiceStatus.OK &&
                  place
                ) {
                  const googleRestaurant = convertGooglePlaceToRestaurant(place);

                  if (googleRestaurant) {
                    window.dispatchEvent(
                      new CustomEvent("nearbyRestaurantsUpdate", {
                        detail: {
                          restaurants: [googleRestaurant],
                        },
                      })
                    );

                    setPopupRestaurant(googleRestaurant);

                    mapInstance.current?.panTo(
                      new window.google.maps.LatLng(
                        googleRestaurant.gps_coordinates.latitude,
                        googleRestaurant.gps_coordinates.longitude
                      )
                    );
                  }
                } else {
                  console.warn("No se pudo obtener detalle del lugar:", status);
                  setPopupRestaurant(null);
                }
              }
            );

            return;
          }

          setPopupRestaurant(null);
        });
      } else {
        mapInstance.current.setOptions({
          ...getGoogleMapThemeOptions(actualTheme),
          draggable: true,
          gestureHandling: "greedy",
          scrollwheel: true,
          clickableIcons: true,
          disableDoubleClickZoom: false,
          keyboardShortcuts: true,
        });
      }

      markersRef.current.forEach((marker) => {
        if (marker?.setMap) {
          marker.setMap(null);
        } else if (marker?.map !== undefined) {
          marker.map = null;
        }
      });

      markersRef.current = [];
      restaurantMarkersByIdRef.current = {};
      restaurantByIdRef.current = {};

      const restaurantSourceMap = new Map<string, Restaurant>();

      restaurants.forEach((restaurant) => {
        restaurantSourceMap.set(restaurant.id, restaurant);
      });

      googlePoiRestaurants.forEach((restaurant) => {
        if (!restaurantSourceMap.has(restaurant.id)) {
          restaurantSourceMap.set(restaurant.id, restaurant);
        }
      });

      const portalDotRestaurants = Array.from(restaurantSourceMap.values());

      // Cuando hay filtro Akipe, NO ocultamos de golpe los restaurantes fuera del radio:
      // los dejamos en gris/opacos y resaltamos los que sí entran al círculo.
      const displayRestaurants = portalDotRestaurants.slice(0, MAX_AKIPE_DOTS);

      displayRestaurants.forEach((restaurant) => {
        if (!mapInstance.current || !window.google?.maps) return;

        const isSelected = popupRestaurant?.id === restaurant.id;
        const isOutsideFilter =
          Boolean(selectedRadius && centerLocation) &&
          !isRestaurantInsideRadius(restaurant, centerLocation, selectedRadius);

        const marker = new window.google.maps.Marker({
          position: new window.google.maps.LatLng(
            restaurant.gps_coordinates.latitude,
            restaurant.gps_coordinates.longitude
          ),
          map: mapInstance.current,
          title: restaurant.name,
          optimized: false,
          opacity: isSelected ? 1 : isOutsideFilter ? 0.34 : 0.98,
          zIndex: isSelected ? 1200 : isOutsideFilter ? 120 : isFerxxo ? 700 : 850,
          icon: isFerxxo
            ? getFerxxoGlassPinIcon(
                window.google.maps,
                isSelected
              )
            : getPortalDotIcon(
                window.google.maps,
                restaurant,
                isSelected,
                isDark,
                isOutsideFilter && !isSelected
              ),
        });

        marker.addListener("click", (markerEvent: any) => {
          setShowLocationControls(false);

          const mapRect = mapRef.current?.getBoundingClientRect();
          const domEvent = markerEvent?.domEvent;

          // Fallback garantizado para que el popup salga desde el primer click.
          // Si Google no entrega domEvent/projection a tiempo, usamos el centro visible del mapa.
          const fallbackPoint = getClampedPopupPoint({
            x: mapRef.current ? mapRef.current.clientWidth / 2 : window.innerWidth / 2,
            y: mapRef.current ? mapRef.current.clientHeight / 2 : window.innerHeight / 2,
          });

          if (domEvent && mapRect) {
            setPopupPoint(
              getClampedPopupPoint({
                x: domEvent.clientX - mapRect.left,
                y: domEvent.clientY - mapRect.top,
              })
            );
          } else {
            setPopupPoint(fallbackPoint);
          }

          // Primero seteamos popupPoint, luego popupRestaurant.
          // Así React ya tiene coordenadas y no espera un segundo click.
          setPopupRestaurant(restaurant);

          if (mapInstance.current) {
            mapInstance.current.panTo(
              new window.google.maps.LatLng(
                restaurant.gps_coordinates.latitude,
                restaurant.gps_coordinates.longitude
              )
            );
          }

          // Ajuste fino con proyección real cuando el mapa ya procesó el panTo.
          window.setTimeout(() => {
            updatePopupScreenPoint(restaurant);
          }, 80);

          window.setTimeout(() => {
            updatePopupScreenPoint(restaurant);
          }, 180);
        });

        markersRef.current.push(marker);
        restaurantMarkersByIdRef.current[restaurant.id] = marker;
        restaurantByIdRef.current[restaurant.id] = restaurant;
      });

      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }

      if (selectedRadius && centerLocation && mapInstance.current) {
        circleRef.current = new window.google.maps.Circle({
          strokeColor: isFerxxo ? "#00FF66" : "#C79A5B",
          strokeOpacity: isFerxxo ? 0.58 : 0.52,
          strokeWeight: isFerxxo ? 1.8 : 1.4,
          fillColor: isFerxxo ? "#00FF66" : "#C79A5B",
          fillOpacity: isFerxxo ? 0.075 : 0.055,
          map: mapInstance.current,
          center: new window.google.maps.LatLng(
            centerLocation.lat,
            centerLocation.lng
          ),
          radius: selectedRadius * 1000,
          clickable: false,
        });
      }

      if (userLocation && mapInstance.current) {
        if (!userMarkerRef.current) {
          userMarkerRef.current = new window.google.maps.Marker({
            position: new window.google.maps.LatLng(
              userLocation.latitude,
              userLocation.longitude
            ),
            map: mapInstance.current,
            title: "Tu ubicación",
            draggable: true,
            clickable: true,
            optimized: false,
            zIndex: 20000,
            cursor: "grab",
            icon: getUserMarkerIcon(window.google.maps, getRestingMarkerState()),
          });

          userMarkerRef.current.addListener("click", () => {
            setIsGpsActive(false);
          });

          userMarkerRef.current.addListener("dragstart", () => {
            setPopupRestaurant(null);
            userMarkerRef.current?.setZIndex(30000);
            userMarkerRef.current?.setCursor?.("grabbing");
            startUserDragAnimation();
          });

          userMarkerRef.current.addListener("dragend", (event: any) => {
            const newPosition = event.latLng;
            const newLocation = {
              lat: newPosition.lat(),
              lng: newPosition.lng(),
            };

            setManualLocation(newLocation);
            setFixedLocation(newLocation);
            clearDragAnimation();
            userMarkerRef.current?.setZIndex(20000);
            userMarkerRef.current?.setCursor?.("grab");
            setUserIcon(getRestingMarkerState());

            setTimeout(() => {
              startRouteMotionAnimation();
            }, 50);

            window.dispatchEvent(
              new CustomEvent("manualLocationUpdate", {
                detail: {
                  latitude: newLocation.lat,
                  longitude: newLocation.lng,
                },
              })
            );
          });
        } else if (!manualLocation && !fixedLocation) {
          userMarkerRef.current.setPosition(
            new window.google.maps.LatLng(
              userLocation.latitude,
              userLocation.longitude
            )
          );

          userMarkerRef.current.setDraggable(true);
          userMarkerRef.current.setClickable(true);
          userMarkerRef.current.setZIndex(20000);
          setUserIcon(getRestingMarkerState());
        }

        if (!hasInitialZoom && mapInstance.current) {
          mapInstance.current.setCenter(
            new window.google.maps.LatLng(
              userLocation.latitude,
              userLocation.longitude
            )
          );
          mapInstance.current.setZoom(16);
          setHasInitialZoom(true);
        }
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setLoadingError("Error initializing map");
    }
  }, [
    googleMapsLoaded,
    restaurants,
    googlePoiRestaurants,
    selectedRadius,
    userLocation,
    manualLocation,
    propFixedLocation,
    hasInitialZoom,
    isDark,
    isFerxxo,
    actualTheme,
  ]);

  useEffect(() => {
    if (
      !googleMapsLoaded ||
      !mapInstance.current ||
      !window.google ||
      !window.google.maps ||
      !activeRouteRestaurant ||
      !activeTravelMode
    ) {
      return;
    }

    const originLocation = propFixedLocation
      ? {
          lat: propFixedLocation.lat,
          lng: propFixedLocation.lng,
        }
      : manualLocation
      ? {
          lat: manualLocation.lat,
          lng: manualLocation.lng,
        }
      : fixedLocation
      ? {
          lat: fixedLocation.lat,
          lng: fixedLocation.lng,
        }
      : userLocation
      ? {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        }
      : null;

    if (!originLocation) {
      alert("No se pudo obtener tu ubicación para calcular la ruta.");
      return;
    }

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapInstance.current,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
          strokeWeight: 6,
          strokeOpacity: 0.88,
          clickable: false,
        },
      });
    } else {
      directionsRendererRef.current.setOptions({
        map: mapInstance.current,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
          strokeWeight: 6,
          strokeOpacity: 0.88,
          clickable: false,
        },
      });

      directionsRendererRef.current.setMap(mapInstance.current);
    }

    mapInstance.current.setOptions({
      draggable: true,
      gestureHandling: "greedy",
      scrollwheel: true,
      clickableIcons: true,
      disableDoubleClickZoom: false,
      keyboardShortcuts: true,
    });

    const request: any = {
      origin: originLocation,
      destination: {
        lat: activeRouteRestaurant.gps_coordinates.latitude,
        lng: activeRouteRestaurant.gps_coordinates.longitude,
      },
      travelMode:
        activeTravelMode === "walking"
          ? window.google.maps.TravelMode.WALKING
          : window.google.maps.TravelMode.DRIVING,
    };

    directionsServiceRef.current.route(request, (result: any, status: any) => {
      if (status === window.google.maps.DirectionsStatus.OK && result) {
        directionsRendererRef.current.setDirections(result);
        startRouteMotionAnimation();

        mapInstance.current.setOptions({
          ...getGoogleMapThemeOptions(actualTheme),
          draggable: true,
          gestureHandling: "greedy",
          scrollwheel: true,
          clickableIcons: true,
          disableDoubleClickZoom: false,
          keyboardShortcuts: true,
        });
      } else {
        console.error("Error calculando ruta:", status);
        alert("No se pudo calcular la ruta. Intenta nuevamente.");
      }
    });
  }, [
    googleMapsLoaded,
    activeRouteRestaurant,
    activeTravelMode,
    userLocation,
    propFixedLocation,
    manualLocation,
    fixedLocation,
  ]);

  useEffect(() => {
    if (!googleMapsLoaded || !window.google) return;

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          if (
            mapInstance.current &&
            userMarkerRef.current &&
            !fixedLocation &&
            !manualLocation
          ) {
            userMarkerRef.current.setPosition({
              lat: newLocation.latitude,
              lng: newLocation.longitude,
            });

            setUserIcon(getRestingMarkerState());
            setIsGpsActive(true);
          }
        },
        (error) => {
          const { errorMessage, errorCode } = handleGeolocationError(error);
          console.error("Error watching position:", errorMessage);

          if (errorCode === 3) {
            console.log("Map GPS watch timeout - will retry automatically");
          }

          setIsGpsActive(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 60000,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [
    googleMapsLoaded,
    fixedLocation,
    manualLocation,
    activeTravelMode,
  ]);

  if (!googleMapsLoaded) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-md">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-black" />
          <p className="text-gray-600">Cargando mapa...</p>
          {loadingError && (
            <p className="mt-2 text-sm text-red-500">{loadingError}</p>
          )}
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-md">
        <div className="p-6 text-center">
          <div className="mb-4 text-6xl text-red-500">⚠️</div>
          <h3 className="mb-2 text-lg font-semibold">Error al cargar el mapa</h3>
          <p className="mb-4 text-gray-600">{loadingError}</p>
          <button
            onClick={reloadGoogleMaps}
            className="rounded-lg bg-black px-4 py-2 text-white transition-colors hover:bg-gray-800"
          >
            Recargar mapa
          </button>
        </div>
      </div>
    );
  }

  const popupImage = popupRestaurant ? getRestaurantImage(popupRestaurant) : "";
  const popupRating = popupRestaurant ? formatRating(popupRestaurant.rating) : null;
  const routeRating = activeRouteRestaurant
    ? formatRating(activeRouteRestaurant.rating)
    : null;

  return (
    <div className="fixed inset-0 z-10">
      <div ref={mapRef} className="h-full w-full" />

      {popupRestaurant && (
        <div
          className="pointer-events-none absolute z-40 w-[calc(100%-32px)] max-w-[390px] -translate-x-1/2 origin-top animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-200"
          style={{
            left: popupPoint ? `${popupPoint.x}px` : "50%",
            top: popupPoint ? `${popupPoint.y}px` : "46%",
          }}
        >
          <div
            className={`pointer-events-auto relative overflow-visible rounded-[26px] border p-3 shadow-[0_16px_42px_rgba(15,23,42,0.22)] backdrop-blur-2xl ${
              isFerxxo
                ? "border-[#39FF74]/50 bg-[#07160F]/82 text-[#ECFFF3] shadow-[0_0_0_1px_rgba(57,255,116,0.16),0_0_30px_rgba(57,255,116,0.26),0_20px_56px_rgba(0,0,0,0.42)]"
                : isDark
                ? "border-white/10 bg-slate-950/78 text-white"
                : "border-white/75 bg-white/82 text-slate-950"
            }`}
          >
            {/* Punta visual para que el popup parezca salir del portal dot */}
            <div
              className={`pointer-events-none absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t backdrop-blur-2xl ${
                isFerxxo
                  ? "border-[#39FF74]/45 bg-[#07160F]/82 shadow-[0_0_18px_rgba(57,255,116,0.35)]"
                  : isDark
                  ? "border-white/10 bg-slate-950/78"
                  : "border-white/75 bg-white/82"
              }`}
            />

            <div
              className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[26px] ${
                isFerxxo
                  ? "bg-[radial-gradient(circle_at_top_left,rgba(57,255,116,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(0,255,102,0.14),transparent_30%),linear-gradient(135deg,rgba(0,255,102,0.12),rgba(5,18,12,0.08)_42%,rgba(57,255,116,0.06))]"
                  : isDark
                  ? "bg-gradient-to-br from-white/8 via-cyan-300/5 to-blue-500/5"
                  : "bg-gradient-to-br from-white/85 via-white/40 to-white/10"
              }`}
            />

            {isFerxxo && (
              <>
                <div className="pointer-events-none absolute -left-8 top-0 h-24 w-24 rounded-full bg-[#00FF66]/14 blur-3xl" />
                <div className="pointer-events-none absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-[#39FF74]/12 blur-3xl" />
              </>
            )}

            <div className="relative">
              <div className="mb-2 flex justify-center">
                <div
                  className={`h-1 w-9 rounded-full ${
                    isFerxxo
                      ? "bg-[#39FF74] shadow-[0_0_14px_rgba(57,255,116,0.72)]"
                      : isDark
                      ? "bg-white/20"
                      : "bg-slate-300/80"
                  }`}
                />
              </div>

              <div className="flex gap-3">
                {popupImage ? (
                  <img
                    src={popupImage}
                    alt={popupRestaurant.name}
                    className={`h-[74px] w-[74px] shrink-0 rounded-[22px] object-cover shadow-md ${
                      isFerxxo ? "ring-2 ring-[#39FF74]/45 shadow-[0_0_18px_rgba(57,255,116,0.20)]" : ""
                    }`}
                  />
                ) : (
                  <div
                    className={`flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[22px] shadow-md ${
                      isFerxxo
                        ? "bg-[linear-gradient(180deg,rgba(57,255,116,0.14),rgba(8,28,18,0.9))] ring-2 ring-[#39FF74]/45 shadow-[0_0_18px_rgba(57,255,116,0.20)]"
                        : isDark
                        ? "bg-white/10"
                        : "bg-slate-100"
                    }`}
                  >
                    <span className={isFerxxo ? "text-[#39FF74]" : "text-3xl"}>
                      {isFerxxo ? "👻" : "🍽️"}
                    </span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3
                        className={`truncate font-serif text-[20px] font-semibold leading-tight ${
                          isFerxxo
                            ? "text-[#F4FFF7] drop-shadow-[0_0_10px_rgba(57,255,116,0.20)]"
                            : ""
                        }`}
                      >
                        {popupRestaurant.name}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px]">
                        {popupRating && (
                          <>
                            <span
                              className={`flex items-center gap-0.5 ${
                                isFerxxo
                                  ? "text-[#39FF74] drop-shadow-[0_0_8px_rgba(57,255,116,0.45)]"
                                  : "text-[#C79A5B]"
                              }`}
                            >
                              {[0, 1, 2, 3, 4].map((item) => (
                                <Star
                                  key={item}
                                  size={12}
                                  fill="currentColor"
                                  strokeWidth={1.5}
                                />
                              ))}
                            </span>

                            <span className={isFerxxo ? "text-[#D8FFE6]" : isDark ? "text-white/70" : "text-slate-600"}>
                              {popupRating}
                            </span>
                          </>
                        )}

                        <span className={isFerxxo ? "text-[#39FF74]/55" : isDark ? "text-white/45" : "text-slate-400"}>
                          •
                        </span>

                        <span className={isFerxxo ? "text-[#C7FCD8]" : isDark ? "text-white/70" : "text-slate-600"}>
                          {formatCuisine(popupRestaurant)}
                        </span>
                      </div>

                      <p
                        className={`mt-1.5 line-clamp-1 text-[12px] ${
                          isFerxxo
                            ? "text-[#B6EFC8]"
                            : isDark
                            ? "text-white/58"
                            : "text-slate-600"
                        }`}
                      >
                        {popupRestaurant.address || "Elige cómo quieres llegar."}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onFavoriteClick?.(popupRestaurant.id)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-xl transition-all active:scale-95 ${
                          isFerxxo
                            ? favoriteRestaurantIds.includes(popupRestaurant.id)
                              ? "border-[#39FF74]/60 bg-[#39FF74]/14 text-[#39FF74] shadow-[0_0_18px_rgba(57,255,116,0.25)]"
                              : "border-[#39FF74]/30 bg-[#39FF74]/10 text-[#D8FFE6] hover:bg-[#39FF74]/14"
                            : favoriteRestaurantIds.includes(popupRestaurant.id)
                            ? "border-[#C79A5B]/35 bg-[#C79A5B]/14 text-[#C79A5B]"
                            : isDark
                            ? "border-white/10 bg-white/8 text-white hover:bg-white/12"
                            : "border-white/70 bg-white/70 text-slate-900 hover:bg-white"
                        }`}
                        aria-label="Guardar restaurante"
                      >
                        <Heart
                          size={17}
                          fill={favoriteRestaurantIds.includes(popupRestaurant.id) ? "currentColor" : "none"}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPopupRestaurant(null); setPopupPoint(null); }}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-xl transition-all active:scale-95 ${
                          isFerxxo
                            ? "border-[#39FF74]/30 bg-[#39FF74]/10 text-[#E8FFF1] hover:bg-[#39FF74]/14"
                            : isDark
                            ? "border-white/10 bg-white/8 text-white hover:bg-white/12"
                            : "border-white/70 bg-white/70 text-slate-900 hover:bg-white"
                        }`}
                        aria-label="Cerrar popup"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkerRouteSelect(popupRestaurant, "walking")}
                  className={`flex items-center justify-center gap-2 rounded-[20px] border px-3 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] ${
                    isFerxxo
                      ? "border-[#39FF74]/28 bg-[linear-gradient(180deg,rgba(57,255,116,0.10),rgba(8,28,18,0.82))] text-[#F2FFF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_18px_rgba(57,255,116,0.10)] hover:bg-[#39FF74]/12"
                      : isDark
                      ? "border-white/10 bg-white/8 text-white hover:bg-white/12"
                      : "border-white/80 bg-white/70 text-slate-950 shadow-sm hover:bg-white"
                  }`}
                >
                  <Footprints size={18} className={isFerxxo ? "text-[#39FF74]" : ""} />
                  <span className="text-left leading-tight">
                    <span className="block">Caminar</span>
                    <span
                      className={`text-[11px] font-medium ${
                        isFerxxo
                          ? "text-[#B6EFC8]"
                          : isDark
                          ? "text-white/55"
                          : "text-slate-500"
                      }`}
                    >
                      Ver ruta
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMarkerRouteSelect(popupRestaurant, "driving")}
                  className={`flex items-center justify-center gap-2 rounded-[20px] px-3 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] ${
                    isFerxxo
                      ? "bg-gradient-to-br from-[#39FF74] via-[#18F76A] to-[#00C853] text-[#04120A] shadow-[0_0_28px_rgba(57,255,116,0.40),0_10px_26px_rgba(0,0,0,0.26)]"
                      : "bg-gradient-to-br from-slate-900 to-black text-white shadow-[0_12px_28px_rgba(2,6,23,0.22)]"
                  }`}
                >
                  <Car size={18} />
                  <span className="text-left leading-tight">
                    <span className="block">Auto</span>
                    <span className={`text-[11px] font-medium ${isFerxxo ? "text-[#04120A]/70" : "text-white/65"}`}>
                      Ver ruta
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {activeRouteRestaurant && activeTravelMode && (
        <div className="pointer-events-none absolute bottom-32 left-1/2 z-30 w-[calc(100%-28px)] max-w-[560px] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-3 duration-300 sm:bottom-36">
          <div
            className={`pointer-events-auto relative overflow-hidden rounded-[24px] border backdrop-blur-2xl transition-all duration-300 ${
              isDark
                ? "border-cyan-300/20 bg-slate-950/55 shadow-[0_18px_58px_rgba(0,0,0,0.42),0_0_34px_rgba(34,211,238,0.13)]"
                : "border-white/55 bg-white/42 shadow-[0_18px_58px_rgba(15,23,42,0.20)]"
            }`}
          >
            <div
              className={`pointer-events-none absolute inset-0 transition-all duration-300 ${
                isDark
                  ? "bg-gradient-to-br from-white/8 via-cyan-300/5 to-blue-500/5"
                  : "bg-gradient-to-br from-white/70 via-white/32 to-white/12"
              }`}
            />

            <div className="relative px-2.5 py-2.5 sm:px-3">
              <div className="flex items-center gap-2">
                <div
                  className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-[20px] border backdrop-blur-xl transition-all sm:flex ${
                    isDark
                      ? "border-white/10 bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "border-white/60 bg-white/58 text-slate-800 shadow-sm"
                  }`}
                >
                  <Navigation size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3
                      className={`truncate text-[11px] font-bold sm:text-[13px] ${
                        isDark ? "text-white" : "text-slate-950"
                      }`}
                    >
                      Ruta a {activeRouteRestaurant.name}
                    </h3>

                    <div
                      className={`hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md sm:inline-flex ${
                        activeTravelMode === "walking"
                          ? isDark
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "border-emerald-400/25 bg-emerald-500/10 text-emerald-700"
                          : isDark
                          ? "border-blue-400/20 bg-blue-400/10 text-blue-300"
                          : "border-blue-400/25 bg-blue-500/10 text-blue-700"
                      }`}
                    >
                      {activeTravelMode === "walking" ? (
                        <Footprints size={12} />
                      ) : (
                        <Car size={12} />
                      )}
                      {activeTravelMode === "walking" ? "Caminando" : "En auto"}
                    </div>
                  </div>

                  <div className="mt-0.5 flex items-center gap-2">
                    {routeRating && (
                      <span
                        className={`text-[11px] ${
                          isDark ? "text-white/62" : "text-slate-600"
                        }`}
                      >
                        ★ {routeRating}
                      </span>
                    )}
                    <span
                      className={`truncate text-[11px] ${
                        isDark ? "text-white/62" : "text-slate-600"
                      }`}
                    >
                      Puedes mover el mapa libremente
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const destination = `${activeRouteRestaurant.gps_coordinates.latitude},${activeRouteRestaurant.gps_coordinates.longitude}`;
                    const mode =
                      activeTravelMode === "walking" ? "walking" : "driving";

                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${mode}`,
                      "_blank"
                    );
                  }}
                  className={`group flex h-11 shrink-0 items-center gap-1.5 rounded-[18px] border px-2 backdrop-blur-xl transition-all duration-200 active:scale-[0.97] ${
                    isDark
                      ? "border-white/10 bg-white/7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/12"
                      : "border-white/60 bg-white/48 shadow-sm hover:bg-white/65"
                  }`}
                  aria-label="Abrir en Google Maps"
                >
                  <GoogleMapsCompactIcon />

                  <div className="hidden text-left leading-tight sm:block">
                    <div
                      className={`text-[11px] font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Google
                    </div>
                    <div
                      className={`text-[9px] font-medium ${
                        isDark ? "text-white/55" : "text-slate-500"
                      }`}
                    >
                      Maps
                    </div>
                  </div>

                  <ChevronRight
                    size={15}
                    className={`hidden transition-transform group-hover:translate-x-0.5 lg:block ${
                      isDark ? "text-white/60" : "text-slate-500"
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const lat = activeRouteRestaurant.gps_coordinates.latitude;
                    const lng = activeRouteRestaurant.gps_coordinates.longitude;

                    window.open(
                      `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
                      "_blank"
                    );
                  }}
                  className={`group flex h-11 shrink-0 items-center gap-1.5 rounded-[18px] border px-2 backdrop-blur-xl transition-all duration-200 active:scale-[0.97] ${
                    isDark
                      ? "border-white/10 bg-white/7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/12"
                      : "border-white/60 bg-white/48 shadow-sm hover:bg-white/65"
                  }`}
                  aria-label="Abrir en Waze"
                >
                  <WazeCompactIcon />

                  <div className="hidden text-left leading-tight sm:block">
                    <div
                      className={`text-[12px] font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Waze
                    </div>
                    <div
                      className={`text-[9px] font-medium ${
                        isDark ? "text-white/55" : "text-slate-500"
                      }`}
                    >
                      Navegar
                    </div>
                  </div>

                  <ChevronRight
                    size={15}
                    className={`hidden transition-transform group-hover:translate-x-0.5 lg:block ${
                      isDark ? "text-white/60" : "text-slate-500"
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleClearRoute}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] border backdrop-blur-xl transition-all active:scale-95 ${
                    isDark
                      ? "border-white/10 bg-white/7 text-white hover:bg-white/12"
                      : "border-white/60 bg-white/48 text-slate-700 hover:bg-white/65"
                  }`}
                  aria-label="Cerrar ruta"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
<div className="pointer-events-auto absolute right-4 top-1/3 z-10 -translate-y-1/2 transform space-y-3">
        <button
          onClick={() => setShowLocationControls(!showLocationControls)}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/60 bg-white/80 text-gray-800 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/95"
          aria-label="Ubicación"
        >
          <Crosshair size={24} />
        </button>

        <button
          onClick={handleLocationAction}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/60 bg-white/80 text-gray-800 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/95"
          aria-label="Centrar en mi ubicación"
        >
          <LocateFixed size={23} />
        </button>

        {showLocationControls && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowLocationControls(false)}
            />

            <div className="absolute right-16 top-0 z-30 w-64 animate-in slide-in-from-right-2 rounded-3xl bg-white/95 p-4 shadow-xl backdrop-blur-md duration-200">
              <h3 className="mb-3 text-lg font-semibold">Ubicación</h3>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleLocationAction();
                    setShowLocationControls(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-black p-3 text-white transition-colors hover:bg-gray-800"
                >
                  <span className="text-xl">📍</span>
                  <div className="text-left">
                    <div className="font-medium">Usar mi ubicación</div>
                    <div className="text-xs opacity-80">GPS actual</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowAddressInput(true);
                    setShowLocationControls(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-gray-100 p-3 text-black transition-colors hover:bg-gray-200"
                >
                  <span className="text-xl">🏠</span>
                  <div className="text-left">
                    <div className="font-medium">Buscar dirección</div>
                    <div className="text-xs opacity-60">Ej: Av. Larco 123</div>
                  </div>
                </button>

                {propFixedLocation && (
                  <button
                    onClick={() => {
                      handleClearFixedLocation();
                      setShowLocationControls(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-red-100 p-3 text-red-700 transition-colors hover:bg-red-200"
                  >
                    <span className="text-xl">🔄</span>
                    <div className="text-left">
                      <div className="font-medium">Limpiar ubicación fija</div>
                      <div className="text-xs opacity-60">Volver a GPS</div>
                    </div>
                  </button>
                )}

                {propLocationSource && propFixedLocation && (
                  <div className="w-full rounded-2xl bg-gray-50 p-3">
                    <div className="mb-1 text-sm font-medium text-gray-700">
                      Ubicación actual:
                    </div>
                    <div className="text-xs text-gray-600">
                      {propLocationSource === "manual" && "Coordenadas manuales"}
                      {propLocationSource === "address" && "Dirección buscada"}
                      {propLocationSource === "gps" && "GPS activo"}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Lat: {propFixedLocation.lat.toFixed(6)}, Lng:{" "}
                      {propFixedLocation.lng.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showAddressInput && (
        <div className="pointer-events-auto absolute right-4 top-16 z-50 w-80 animate-in slide-in-from-top-2 rounded-3xl bg-white/95 p-4 shadow-xl backdrop-blur-md duration-200">
          <h3 className="mb-2 text-lg font-semibold">Buscar por dirección</h3>

          <input
            type="text"
            placeholder="Ej: Av. Larco 123, Miraflores, Lima"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="mb-2 w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-black/20"
            onKeyDown={(e) => e.key === "Enter" && handleAddressSubmit()}
          />

          <div className="flex gap-2">
            <button
              onClick={handleAddressSubmit}
              className="flex-1 rounded-2xl bg-black py-2 text-white transition-colors hover:bg-gray-800"
            >
              Buscar
            </button>

            <button
              onClick={() => {
                setShowAddressInput(false);
                setAddressInput("");
              }}
              className="flex-1 rounded-2xl bg-gray-200 py-2 text-black transition-colors hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLimaMap;



