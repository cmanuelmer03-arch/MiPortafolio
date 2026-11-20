/* Configuración de Tailwind (debe cargarse después del CDN) */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        spidey: {
          black: '#07090e', dark: '#0c101b', card: 'rgba(15, 23, 42, 0.65)',
          red: '#e23636', ruby: '#ef233c', neon: '#ff1a40',
          blue: '#0ea5e9', webblue: '#2563eb', text: '#94a3b8', light: '#f1f5f9'
        }
      },
      fontFamily: {
        /* Tipografías más naturales: la misma pareja del currículum */
        sans: ['Open Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['Open Sans', 'system-ui', 'sans-serif']
      }
    }
  }
};