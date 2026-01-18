/**
 * Sistema de diseño para Taxi Local
 */

// Paleta de colores
export const colors = {
  primary: "#0FA958", // verde
  primaryDark: "#0B7E3F",
  primaryLight: "#E8F5E9",
  secondary: "#2E3A59", // azul oscuro
  secondaryLight: "#ECEFF1",
  accent: "#FFB800", // amarillo/dorado
  accentLight: "#FFF8E1",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  background: "#F9FAFB",
  surface: "#FFFFFF",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textDisabled: "#9CA3AF",
  border: "#E5E7EB",
  divider: "#F3F4F6",
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.1)"
};

// Tipografía
export const typography = {
  fontFamily: {
    primary: "'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    secondary: "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
    mono: "'Courier New', Courier, monospace"
  },
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    '2xl': "1.5rem", // 24px
    '3xl': "1.875rem", // 30px
    '4xl': "2.25rem", // 36px
    '5xl': "3rem", // 48px
    '6xl': "3.75rem" // 60px
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  }
};

// Espaciados
export const spacing = {
  px: "1px",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem", // 12px
  3.5: "0.875rem", // 14px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  7: "1.75rem", // 28px
  8: "2rem", // 32px
  9: "2.25rem", // 36px
  10: "2.5rem", // 40px
  11: "2.75rem", // 44px
  12: "3rem", // 48px
  14: "3.5rem", // 56px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  28: "7rem", // 112px
  32: "8rem", // 128px
  36: "9rem", // 144px
  40: "10rem", // 160px
  44: "11rem", // 176px
  48: "12rem", // 192px
  52: "13rem", // 208px
  56: "14rem", // 224px
  60: "15rem", // 240px
  64: "16rem", // 256px
  72: "18rem", // 288px
  80: "20rem", // 320px
  96: "24rem" // 384px
};

// Sombras
export const shadows = {
  none: "none",
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  '2xl': "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  outline: "0 0 0 3px rgba(15, 169, 88, 0.5)"
};

// Bordes
export const borders = {
  radius: {
    none: "0px",
    sm: "0.125rem", // 2px
    base: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    '2xl': "1rem", // 16px
    '3xl': "1.5rem", // 24px
    full: "9999px"
  },
  width: {
    0: "0",
    1: "1px",
    2: "2px",
    4: "4px",
    8: "8px"
  },
  style: {
    solid: "solid",
    dotted: "dotted",
    dashed: "dashed",
    double: "double",
    none: "none"
  }
};

// Transiciones y animaciones
export const transitions = {
  duration: {
    fastest: "50ms",
    faster: "100ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "400ms",
    slowest: "500ms"
  },
  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)"
  }
};

// Breakpoints para responsive
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  '2xl': "1536px"
};

// Componentes estilizados
export const components = {
  button: {
    primary: {
      backgroundColor: colors.primary,
      color: colors.surface,
      fontWeight: typography.fontWeight.medium,
      borderRadius: borders.radius.lg,
      padding: `${spacing[3]} ${spacing[6]}`,
      border: "none",
      cursor: "pointer",
      transition: `all ${transitions.duration.fast} ${transitions.easing.inOut}`,
      "&:hover": {
        backgroundColor: colors.primaryDark,
        transform: "translateY(-2px)",
        boxShadow: shadows.md
      },
      "&:active": {
        transform: "translateY(0px)",
        boxShadow: shadows.sm
      },
      "&:disabled": {
        backgroundColor: colors.textDisabled,
        cursor: "not-allowed",
        opacity: 0.6
      }
    },
    secondary: {
      backgroundColor: colors.surface,
      color: colors.primary,
      fontWeight: typography.fontWeight.medium,
      borderRadius: borders.radius.lg,
      padding: `${spacing[3]} ${spacing[6]}`,
      border: `2px solid ${colors.primary}`,
      cursor: "pointer",
      transition: `all ${transitions.duration.fast} ${transitions.easing.inOut}`,
      "&:hover": {
        backgroundColor: colors.primaryLight,
        transform: "translateY(-2px)",
        boxShadow: shadows.md
      },
      "&:active": {
        transform: "translateY(0px)",
        boxShadow: shadows.sm
      },
      "&:disabled": {
        borderColor: colors.textDisabled,
        color: colors.textDisabled,
        cursor: "not-allowed",
        opacity: 0.6
      }
    }
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borders.radius.xl,
    padding: spacing[6],
    boxShadow: shadows.md,
    border: `1px solid ${colors.border}`
  },
  input: {
    padding: `${spacing[3]} ${spacing[4]}`,
    borderRadius: borders.radius.lg,
    border: `2px solid ${colors.border}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    transition: `border-color ${transitions.duration.fast} ${transitions.easing.inOut}`,
    "&:focus": {
      outline: "none",
      borderColor: colors.primary,
      boxShadow: `0 0 0 3px ${colors.primaryLight}`
    },
    "&:disabled": {
      backgroundColor: colors.background,
      cursor: "not-allowed"
    }
  }
};

// Tema completo
export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borders,
  transitions,
  breakpoints,
  components
};

export default theme;