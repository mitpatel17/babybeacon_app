// Central theme file for BabyBeacon app

// Color palette
export const COLORS = {
  // Primary colors
  primary: '#8CC63F',        // Main brand green
  primaryDark: '#72A230',    // Darker version for pressed states
  primaryLight: '#AEDB70',   // Lighter version for highlights
  
  // Secondary colors
  secondary: '#4A90E2',      // Secondary blue color
  secondaryDark: '#3B73B4',  // Darker blue for pressed states
  
  // Functional colors
  success: '#4CAF50',
  danger: '#FF4747',
  warning: '#FFC107',
  info: '#2196F3',
  
  // Neutral colors
  white: '#FFFFFF',
  offWhite: '#F5F5F5',
  lightGrey: '#E0E0E0',
  grey: '#9E9E9E',
  darkGrey: '#616161',
  black: '#212121',
  
  // Background colors
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  modalBackground: 'rgba(0, 0, 0, 0.5)'
};

// Typography
export const FONTS = {
  sizes: {
    xsmall: 12,
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 22,
    xxlarge: 26,
    xxxlarge: 30,
  },
  weights: {
    regular: 'normal',
    medium: '500',
    bold: 'bold',
  }
};

// Spacing
export const SPACING = {
  xs: 5,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 30,
};

// Border radius
export const BORDER_RADIUS = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  round: 50,
};

// Shared component styles
export const SHARED_STYLES = {
  // Common container styles
  container: {
    flex: 1,
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  
  // Form input styles
  input: {
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: BORDER_RADIUS.s,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.l,
    backgroundColor: COLORS.white,
    fontSize: FONTS.sizes.medium,
  },
  
  // Primary button
  primaryButton: {
    height: 50,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.s,
  },
  
  // Secondary button
  secondaryButton: {
    height: 50,
    width: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.s,
  },
  
  // Danger button (for logout, delete, etc.)
  dangerButton: {
    height: 50,
    width: '100%',
    backgroundColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.s,
  },
  
  // Text for buttons
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.medium,
    fontWeight: FONTS.weights.bold,
  },
  
  // Text for links
  linkText: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.small,
    marginVertical: SPACING.m,
  },
  
  // Title text
  title: {
    fontSize: FONTS.sizes.xxlarge,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  
  // Subtitle text
  subtitle: {
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.modalBackground,
  },
  
  modalContent: {
    width: '85%',
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.s,
    alignItems: 'center',
  },
  
  modalTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.l,
  },
  
  // Form container
  formContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  
  // Input label
  inputLabel: {
    fontSize: FONTS.sizes.medium,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
    alignSelf: 'flex-start',
  },
}; 