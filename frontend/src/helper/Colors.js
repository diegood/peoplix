export function calculateColorHighContrastByString(str) {
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const r = (hash >> 16) & 255
  const g = (hash >> 8) & 255
  const b = hash & 255
  return `rgb(${r}, ${g}, ${b})`
}

export function calculateHexColorByString(str) {
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const r = (hash >> 16) & 255
  const g = (hash >> 8) & 255
  const b = hash & 255
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}



export function invertColor(hex) {
  hex = removeHashtag(hex);
  hex = convertHexa3to6(hex);
  if (hex.length !== 6) return '#000000';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return r * 0.299 + g * 0.587 + b * 0.114 > 128 ? '#000000' : '#FFFFFF';
}

export function removeHashtag(hex) {
  if (hex.indexOf('#') === 0) hex = hex.slice(1);
  return hex;
}

function convertHexa3to6(hex) {
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return hex;
}

export function stringToColor(str) {
  if (!str) return '#000000';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

export function rgbToHex(r, g, b) {
  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function lightenColor(hex, amount) {
  const [r, g, b] = _hexToRgb(hex);
  return rgbToHex(_adjustBrightness(r, amount), _adjustBrightness(g, amount), _adjustBrightness(b, amount));
}

export function adjustColor(hex, percentage = 25) {
  const amount = Math.round((percentage / 100) * 255);
  const [r, g, b] = _hexToRgb(hex);
  return rgbToHex(_adjustBrightness(r, amount), _adjustBrightness(g, amount), _adjustBrightness(b, amount));
}

function _hexToRgb(hex) {
  if (hex[0] === '#') {
    hex = hex.slice(1);
  }
  const num = parseInt(hex, 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

function _adjustBrightness(component, amount) {
  return Math.min(255, Math.max(0, component + amount));
}

/**
 * Genera colores RGB estables por id, evitando tonos similares a un color base.
 *
 * @param {string[]} ids - Lista de identificadores únicos.
 * @param {string} excludeColor - Color base a evitar (en formato "rgb(r, g, b)").
 * @param {number} tolerance - Tolerancia en distancia de color (por defecto 60 en el espacio RGB).
 * @returns {Record<string, string>} Objeto con colores por id en formato "rgb(r, g, b)".
 */
export function generateContrastingRgbColorsById(ids, excludeColor, tolerance = 60) {
  const [rEx, gEx, bEx] = parseRgb(excludeColor);
  const colorMap = {};

  for (const id of ids) {
    let color;
    let distance;
    let attempt = 0;
    do {
      color = idToRgbColor(id, attempt++);
      const [r, g, b] = color;
      distance = Math.sqrt((r - rEx) ** 2 + (g - gEx) ** 2 + (b - bEx) ** 2);
    } while (distance < tolerance && attempt < 10);

    colorMap[id] = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }

  return colorMap;
}

function parseRgb(rgbString) {
  const match = rgbString.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) throw new Error('Formato RGB inválido');
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

function idToRgbColor(id, salt = 0) {
  let hash = stableHash(mixId(id));
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33 + id.charCodeAt(i) + salt * 17) >>> 0;
  }
  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;
  const minBrightness = 40;
  return [Math.max(r, minBrightness), Math.max(g, minBrightness), Math.max(b, minBrightness)];
}

function stableHash(id) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

function mixId(id) {
  const x = parseInt(id, 10);
  return ((Math.sin(x * 99991) + 1) * 1000000).toString();
}
