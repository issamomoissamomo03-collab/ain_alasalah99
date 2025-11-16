// Configure Tailwind to use Cairo as the default sans font
tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['Cairo', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol']
        },
        container: {
          center: true,
          padding: {
            DEFAULT: '1rem',
            sm: '1.25rem',
            lg: '2rem',
            xl: '2rem',
            '2xl': '2.5rem',
          },
        }
      }
    }
  }
  