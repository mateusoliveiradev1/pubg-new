// Adaptando as cores do Impeccable para identidade visual do PUBG
// Fonte: https://github.com/pbakaus/impeccable (conceito de palette)

// We'll create a theme object that can be used with a UI library like 
// @mui/material or we can create our own components. Since we are not 
// using a specific UI library, we'll create our own components inspired by Impeccable.

// For now, we'll define the color palette and some basic styling constants.

export const impeccableTheme = {
  // Cores base do Impeccable adaptadas para PUBG
  primary: {
    // Amarelo PUBG
    light: '#ffff00',   // Amarelo PUBG claro
    main: '#ffcc00',    // Amarelo PUBG principal (usado em logos e destaques)
    dark: '#e6b800',    // Amarelo PUBG escuro
    contrastText: '#000000', // Texto sobre amarelo principal (preto)
  },
  secondary: {
    // Cinza para elementos secundários
    light: '#ffffff',   // Branco
    main: '#f0f0f0',    // Cinza muito claro
    dark: '#cccccc',    // Cinza claro
    contrastText: '#000000', // Texto sobre secundário (preto)
  },
  background: {
    default: '#000000', // Preto PUBG (fundo da aplicação)
    paper: '#1a1a1a',   // Preto muito escuro para cards, surfaces
  },
  // Tipografia (baseada em padrões do Impeccable, adaptada)
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    fontSize: 14, // px
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 300,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 300,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 300,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 300,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 400,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none', // Impeccable likely avoids text-transform
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 400,
      textTransform: 'uppercase',
    },
  },
  // Shape (bordas arredondadas)
  shape: {
    borderRadius: 8,
  },
  // Transições
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      // most basic: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      // This is the most common easing curve.
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOutBack: 'cubic-bezier(0.12, 0, 0.39, 1)',
      easeInBack: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  // Z-index
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};

// Função utilitária para obter a cor do tema (exemplo de uso)
export const getThemeColor = (color: keyof typeof impeccableTheme, shade?: keyof typeof impeccableTheme[typeof color]) => {
  if (shade && impeccableTheme[color] && typeof impeccableTheme[color] === 'object') {
    return impeccableTheme[color][shade as keyof typeof impeccableTheme[typeof color]];
  }
  return impeccableTheme[color];
};

export default impeccableTheme;
