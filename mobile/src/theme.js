import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { Platform } from 'react-native';

export const theme = {
  ...MD3LightTheme,
  roundness: 4,
  fonts: configureFonts({ config: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' } }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563EB',
    secondary: '#0F766E',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    error: '#B91C1C',
  },
};
