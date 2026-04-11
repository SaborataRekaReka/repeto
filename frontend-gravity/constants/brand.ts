/*
 * Repeto — Brand Design Tokens
 * Source of truth for all brand colors, derived from the logo.
 *
 * Logo Purple: #AE7AFF  (primary)
 * Logo Green:  #98E9AB  (accent)
 *
 * Usage in inline styles:
 *   import { brand, accent, semantic } from "@/constants/brand";
 *   style={{ color: brand[700] }}          // readable purple text
 *   style={{ background: brand[400] }}     // logo purple fill
 *   style={{ background: accent[300] }}    // logo green fill
 */

/** Primary brand purple scale — derived from logo #AE7AFF */
export const brand = {
    50: "#F5EEFF",
    100: "#EDE2FF",
    200: "#D9C0FF",
    300: "#C49DFF",
    400: "#AE7AFF",
    500: "#9B5FFF",
    600: "#8840F5",
    700: "#7030D9",
    800: "#5820B8",
    900: "#42189A",
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
    warning: "#AE7AFF",
    warningDark: "#8E7BFF",
    info: "#AE7AFF",
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
