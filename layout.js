// Present ratings as a conventional single-row scale before the fun begins.
initializePositions = function () {
  const buttons = [...movers, tenButton];
  const width = area.clientWidth;
  const height = area.clientHeight;
  const padding = CONFIG.wallPadding;

  const totalButtonWidth = buttons.reduce(
    (total, button) => total + button.offsetWidth,
    0
  );

  const availableGap =
    (width - padding * 2 - totalButtonWidth) / (buttons.length - 1);

  const gap = Math.max(4, availableGap);
  const rowWidth = totalButtonWidth + gap * (buttons.length - 1);
  let x = Math.max(padding, (width - rowWidth) / 2);

  buttons.forEach((button) => {
    button.style.left = `${x}px`;
    button.style.top = `${(height - button.offsetHeight) / 2}px`;
    x += button.offsetWidth + gap;
  });
};

initializePositions();
