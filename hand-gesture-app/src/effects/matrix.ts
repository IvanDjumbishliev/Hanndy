const MATRIX_CHARACTERS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';

export const triggerMatrix = (): (() => void) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return (): void => {};

  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '100',
    pointerEvents: 'none',
    opacity: '1',
    transition: 'opacity 500ms ease',
  });
  document.body.append(canvas);

  const fontSize = 16;
  let columns = 0;
  let drops: number[] = [];
  let speeds: number[] = [];
  const resize = (): void => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.ceil(canvas.width / fontSize);
    drops = Array.from({ length: columns }, () =>
      Math.floor(Math.random() * (canvas.height / fontSize)));
    speeds = Array.from({ length: columns }, () => 0.5 + Math.random() * 1.5);
  };
  resize();
  window.addEventListener('resize', resize);

  let frameId = 0;
  let removeTimeout = 0;
  let finishTimeout = 0;
  let active = true;
  const cleanup = (): void => {
    window.clearTimeout(finishTimeout);
    window.clearTimeout(removeTimeout);
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
  const draw = (): void => {
    if (!active) return;
    context.fillStyle = 'rgba(0, 0, 0, 0.08)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = `${fontSize}px monospace`;
    context.fillStyle = '#00ff41';
    drops.forEach((drop: number, column: number): void => {
      const character = MATRIX_CHARACTERS[Math.floor(Math.random() * MATRIX_CHARACTERS.length)];
      if (character) context.fillText(character, column * fontSize, drop * fontSize);
      const nextDrop = drop + (speeds[column] ?? 1);
      drops[column] = nextDrop * fontSize > canvas.height && Math.random() > 0.975 ? 0 : nextDrop;
    });
    frameId = window.requestAnimationFrame(draw);
  };
  frameId = window.requestAnimationFrame(draw);

  finishTimeout = window.setTimeout((): void => {
    active = false;
    window.cancelAnimationFrame(frameId);
    canvas.style.opacity = '0';
    removeTimeout = window.setTimeout(cleanup, 500);
  }, 3000);
  return cleanup;
};
