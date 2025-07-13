// Theme Configuration

export const THEME = {
  // Node Colors
  NODE_COLORS: {
    file: {
      primary: '#4F46E5',
      lightBg: '#E0E7FF',
      bg: '#C7D2FE',
      border: '#818CF8',
      hover: '#6366F1',
      text: '#1E1B4B'
    },
    api: {
      primary: '#10B981',
      lightBg: '#D1FAE5',
      bg: '#A7F3D0',
      border: '#34D399',
      hover: '#059669',
      text: '#064E3B'
    },
    function: {
      primary: '#F59E0B',
      lightBg: '#FEF3C7',
      bg: '#FDE68A',
      border: '#FBBF24',
      hover: '#D97706',
      text: '#78350F'
    },
    websocket: {
      primary: '#8B5CF6',
      lightBg: '#EDE9FE',
      bg: '#DDD6FE',
      border: '#A78BFA',
      hover: '#7C3AED',
      text: '#4C1D95'
    },
    graphql: {
      primary: '#EC4899',
      lightBg: '#FCE7F3',
      bg: '#FBCFE8',
      border: '#F472B6',
      hover: '#DB2777',
      text: '#831843'
    },
    translation: {
      primary: '#06B6D4',
      lightBg: '#CFFAFE',
      bg: '#A5F3FC',
      border: '#22D3EE',
      hover: '#0891B2',
      text: '#164E63'
    },
    proto: {
      primary: '#84CC16',
      lightBg: '#ECFCCB',
      bg: '#D9F99D',
      border: '#A3E635',
      hover: '#65A30D',
      text: '#365314'
    },
    yaml: {
      primary: '#EAB308',
      lightBg: '#FEF9C3',
      bg: '#FDE047',
      border: '#FACC15',
      hover: '#CA8A04',
      text: '#713F12'
    },
    service: {
      primary: '#6366F1',
      lightBg: '#E0E7FF',
      bg: '#C7D2FE',
      border: '#818CF8',
      hover: '#4F46E5',
      text: '#312E81'
    },
    database: {
      primary: '#059669',
      lightBg: '#D1FAE5',
      bg: '#6EE7B7',
      border: '#10B981',
      hover: '#047857',
      text: '#064E3B'
    },
    config: {
      primary: '#DC2626',
      lightBg: '#FEE2E2',
      bg: '#FECACA',
      border: '#F87171',
      hover: '#B91C1C',
      text: '#7F1D1D'
    },
    test: {
      primary: '#16A34A',
      lightBg: '#DCFCE7',
      bg: '#BBF7D0',
      border: '#4ADE80',
      hover: '#15803D',
      text: '#14532D'
    },
    mock: {
      primary: '#7C3AED',
      lightBg: '#F3E8FF',
      bg: '#E9D5FF',
      border: '#C084FC',
      hover: '#6D28D9',
      text: '#4C1D95'
    },
    helper: {
      primary: '#0EA5E9',
      lightBg: '#E0F2FE',
      bg: '#BAE6FD',
      border: '#38BDF8',
      hover: '#0284C7',
      text: '#0C4A6E'
    },
    component: {
      primary: '#F97316',
      lightBg: '#FED7AA',
      bg: '#FDBA74',
      border: '#FB923C',
      hover: '#EA580C',
      text: '#7C2D12'
    },
    default: {
      primary: '#6B7280',
      lightBg: '#F3F4F6',
      bg: '#E5E7EB',
      border: '#9CA3AF',
      hover: '#4B5563',
      text: '#1F2937'
    }
  },

  // Status Colors
  STATUS_COLORS: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    neutral: '#6B7280'
  },

  // Collaboration Colors
  COLLABORATION_COLORS: [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#84CC16', // Lime
    '#06B6D4'  // Cyan
  ],

  // Contrast Colors for Accessibility
  CONTRAST: {
    black: '#000000',
    white: '#FFFFFF',
    darkGray: '#374151',
    lightGray: '#F9FAFB'
  },

  // Background Colors
  BACKGROUNDS: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    canvas: '#F5F5F5',
    dark: '#1F2937'
  },

  // Border Colors
  BORDERS: {
    default: '#E5E7EB',
    focus: '#3B82F6',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B'
  },

  // Text Colors
  TEXT: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    error: '#DC2626',
    success: '#059669',
    warning: '#D97706'
  },

  // Shadow Colors
  SHADOWS: {
    sm: 'rgba(0, 0, 0, 0.05)',
    md: 'rgba(0, 0, 0, 0.1)',
    lg: 'rgba(0, 0, 0, 0.15)',
    xl: 'rgba(0, 0, 0, 0.2)'
  }
} as const;

// Helper function to get node color based on type
export const getNodeColor = (type: string): any => {
  const colorKey = type.toLowerCase() as keyof typeof THEME.NODE_COLORS;
  return THEME.NODE_COLORS[colorKey] || THEME.NODE_COLORS.default;
};

// Helper function to get collaboration color by index
export const getCollaborationColor = (index: number): string => {
  return THEME.COLLABORATION_COLORS[index % THEME.COLLABORATION_COLORS.length];
};

// Export type for theme
export type ThemeType = typeof THEME;