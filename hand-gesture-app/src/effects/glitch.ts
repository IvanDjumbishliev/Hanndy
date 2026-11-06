export const triggerGlitch = (root: HTMLElement): (() => void) => {
  root.classList.add('glitch-active');
  const timeoutId = window.setTimeout((): void => {
    root.classList.remove('glitch-active');
  }, 1500);

  return (): void => {
    window.clearTimeout(timeoutId);
    root.classList.remove('glitch-active');
  };
};
