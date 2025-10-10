import {definePreset, palette} from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const UTFPR_BLUE_PRIMARY = '#00488E';
const UTFPR_BLUE_SECONDARY = '#1B75BC';
const UTFPR_YELLOW_ACCENT = '#FCBC00';
const BLACK_TEXT = '#000000';

const PrimeUTFPRPreset = definePreset(Aura, {
  semantic: {
    primary: palette(UTFPR_BLUE_PRIMARY),
    info: palette(UTFPR_BLUE_SECONDARY),
    warning: palette(UTFPR_YELLOW_ACCENT),

    contrast: {
      'primary-color': '#FFFFFF',
      'info-color': '#FFFFFF',
      'warning-color': '#000000',
    },

    surface: {
      light: { 'surface-0': '#FFFFFF', 'surface-50': '#F8F8F8', 'surface-800': '#495057', 'surface-900': '#212529' },
      dark: { 'surface-0': '#1A1D20', 'surface-50': '#2A2E33', 'surface-800': '#DEE2E6', 'surface-900': '#FFFFFF' }
    },

    colorScheme: {
      light: { 'text-color': '#212529', 'text-color-secondary': '#6C757D' },
      dark: { 'text-color': '#F8F9FA', 'text-color-secondary': '#ADB5BD' }
    }
  },

  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            primary: {
              background: UTFPR_YELLOW_ACCENT,
              hoverBackground: UTFPR_YELLOW_ACCENT,
              activeBackground: UTFPR_YELLOW_ACCENT,
              borderColor: UTFPR_YELLOW_ACCENT,
              hoverBorderColor: UTFPR_YELLOW_ACCENT,
              color: BLACK_TEXT,
              hoverColor: BLACK_TEXT,
              activeColor: BLACK_TEXT
            },
            info: {
              color: '{contrast.info-color}',
              hoverColor: '{contrast.info-color}'
            }
          }
        },
        dark: {
          root: {
            primary: {
              background: 'transparent',
              hoverBackground: 'rgba(252, 188, 0, 0.04)',
              activeBackground: 'rgba(252, 188, 0, 0.16)',
              borderColor: UTFPR_YELLOW_ACCENT,
              hoverBorderColor: UTFPR_YELLOW_ACCENT,
              activeBorderColor: UTFPR_YELLOW_ACCENT,
              color: UTFPR_YELLOW_ACCENT,
              hoverColor: UTFPR_YELLOW_ACCENT,
              activeColor: UTFPR_YELLOW_ACCENT
            },
            info: {
              color: '{contrast.info-color}',
              hoverColor: '{contrast.info-color}'
            }
          }
        }
      }
    }
  }
});

export default PrimeUTFPRPreset;
