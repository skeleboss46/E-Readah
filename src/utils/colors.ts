const SPINE_COLORS = [
  '#8B2500', '#6B1C23', '#4A1A2E', '#2C1810',
  '#1B3A4B', '#1D3557', '#264653', '#2D4739',
  '#3C5233', '#5C4033', '#6B4226', '#8B6914',
  '#4A3728', '#3D2B1F', '#5E3A22', '#483D3F',
  '#354F52', '#52796F', '#6D4C7D', '#4A366A',
  '#704241', '#8E5B4A', '#5B7065', '#445E6B',
  '#6E4B3A', '#7D5A50', '#3B4252', '#434C5E',
  '#4C566A', '#5E2D50', '#614051', '#5C3D2E',
];

export function generateSpineColor(title: string, author: string): string {
  let hash = 0;
  const str = title + author;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return SPINE_COLORS[Math.abs(hash) % SPINE_COLORS.length];
}

export function generateSpineDimensions(fileSizeBytes: number, pageCount?: number): { width: number; height: number } {
  const pages = pageCount || Math.max(50, Math.min(800, fileSizeBytes / 1500));
  const width = Math.max(28, Math.min(52, 20 + (pages / 30)));
  const heightBase = 190;
  const heightVariation = ((fileSizeBytes % 17) / 17) * 20 - 10;
  const height = heightBase + heightVariation;
  return { width: Math.round(width), height: Math.round(height) };
}

export function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, r + amount);
  const ng = Math.min(255, g + amount);
  const nb = Math.min(255, b + amount);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

export function getTextColor(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#e8e0d4';
}
