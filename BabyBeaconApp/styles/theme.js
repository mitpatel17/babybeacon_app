export const COLORS = {
  primary: '#8CC63F',
  primaryDark: '#72A230',
  primaryLight: '#AEDB70',
  
  secondary: '#4A90E2',
  secondaryDark: '#3B73B4',
  
  success: '#4CAF50',
  danger: '#FF4747',
  warning: '#FFC107',
  info: '#2196F3',
  
  white: '#FFFFFF',
  offWhite: '#F5F5F5',
  lightGrey: '#E0E0E0',
  grey: '#9E9E9E',
  darkGrey: '#616161',
  black: '#212121',
  
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  modalBackground: 'rgba(0, 0, 0, 0.5)'
};

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

export const SPACING = {
  xs: 5,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 30,
};

export const BORDER_RADIUS = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  round: 50,
};

export const SHARED_STYLES = {
  container: {
    flex: 1,
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  
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
  
  primaryButton: {
    height: 50,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.s,
  },
  
  secondaryButton: {
    height: 50,
    width: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.s,
  },
  
  dangerButton: {
    height: 50,
    width: '100%',
    backgroundColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.s,
  },
  
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.medium,
    fontWeight: FONTS.weights.bold,
  },
  
  linkText: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.small,
    marginVertical: SPACING.m,
  },
  
  title: {
    fontSize: FONTS.sizes.xxlarge,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  
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
  
  formContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  
  inputLabel: {
    fontSize: FONTS.sizes.medium,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
    alignSelf: 'flex-start',
  },
}; 