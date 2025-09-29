import {definePreset, palette} from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const UTFPR_BLUE_PRIMARY = '#00488E';
const UTFPR_BLUE_SECONDARY = '#1B75BC';
const UTFPR_YELLOW_ACCENT = '#F3C400';

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
              color: '{contrast.primary-color}',
              hoverColor: '{contrast.primary-color}'
            },
            info: {
              color: '{contrast.info-color}',
              hoverColor: '{contrast.info-color}'
            },
            warn: {
              color: '{contrast.warning-color}',
              hoverColor: '{contrast.warning-color}'
            }
          }
        },
        dark: {
          root: {
            primary: {
              color: '{contrast.primary-color}',
              hoverColor: '{contrast.primary-color}'
            },
            info: {
              color: '{contrast.info-color}',
              hoverColor: '{contrast.info-color}'
            },
            warn: {
              color: '{contrast.warning-color}',
              hoverColor: '{contrast.warning-color}'
            }
          }
        }
      }
    }
  }
});

export default PrimeUTFPRPreset;
