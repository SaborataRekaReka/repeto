/*
 * Repeto — Brand Design Tokens
 * Source of truth for all brand colors, derived from the logo.
 *
 * Logo Blue:   #005BAC  (primary)
 * Logo Green:  #98E9AB  (accent)
 *
 * Usage in inline styles:
 *   import { brand, accent, semantic } from "@/constants/brand";
 *   style={{ color: brand[700] }}          // readable brand text
 *   style={{ background: brand[400] }}     // logo brand fill
 *   style={{ background: accent[300] }}    // logo green fill
 */

/** Primary brand blue scale — derived from logo #005BAC */
export const brand = {
    50: "#E6F1FA",
    100: "#CCE3F5",
    200: "#99C8EA",
    300: "#66ACDF",
    400: "#005BAC",
    500: "#004D90",
    600: "#00427C",
    700: "#003663",
    800: "#00294B",
    900: "#001D35",
} as const;

/** Accent green scale — derived from logo #98E9AB */
export const accent = {
    50: "#F0FBF4",
    100: "#DBF5E3",
    200: "#B8ECC7",
    300: "#98E9AB",
    400: "#68D983",
    500: "#42C862",
    600: "#2FA84D",
    700: "#27893F",
    800: "#216E35",
    900: "#1B5A2C",
} as const;

/** Semantic colors for statuses and feedback */
export const semantic = {
    success: "#22C55E",
    successDark: "#16A34A",
    danger: "#D16B8F",
    dangerDark: "#B85C7E",
    warning: "#005BAC",
    warningDark: "#004D90",
    info: "#005BAC",
} as const;

/** Gradient presets using brand colors */
export const gradients = {
    brand: `linear-gradient(135deg, ${brand[400]} 0%, ${brand[700]} 100%)`,
    accent: `linear-gradient(135deg, ${accent[300]} 0%, ${accent[600]} 100%)`,
    danger: `linear-gradient(135deg, ${semantic.danger} 0%, ${semantic.dangerDark} 100%)`,
    warning: `linear-gradient(135deg, ${semantic.warning} 0%, ${semantic.warningDark} 100%)`,
    success: `linear-gradient(135deg, ${semantic.success} 0%, ${semantic.successDark} 100%)`,
} as const;

/** Brand rgba helper for inline styles */
export function brandAlpha(shade: keyof typeof brand, alpha: number): string {
    const hex = brand[shade];
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
