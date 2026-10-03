// canvas-confetti is loaded only when something is celebrated, not with the app.
export const confetti = (options) =>
  import('canvas-confetti').then(({ default: fire }) => fire({ disableForReducedMotion: true, ...options })).catch(() => {});
