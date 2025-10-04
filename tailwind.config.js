module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "!./src/**/*.spec.ts",  // Exclude tests
  ],
  theme: {
    extend: {
      screens: {
        'xs': '426px',
        'mdp': '769px',
      },
      colors: {
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
      },
    },
    plugins: [],
  }
}
