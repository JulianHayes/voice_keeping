(() => {
  const start = [
    [22,42,22,50,22,58], [36,31,36,50,36,69], [50,22,50,50,50,78],
    [64,31,64,50,64,69], [78,42,78,50,78,58]
  ];
  const end = [
    [18,17,23,27,28,37], [32,45,36,53,40,61], [44,69,50,81,56,69],
    [60,61,64,53,68,45], [72,37,77,27,82,17]
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const instances = new Map();
  const lag = [0,45,90,45,0];
  function draw(svg, points) {
    svg.querySelectorAll('path').forEach((path, i) => {
      const p = points[i];
      path.setAttribute('d', 'M'+p[0]+' '+p[1]+' L'+p[2]+' '+p[3]+' L'+p[4]+' '+p[5]);
    });
  }
  function status(svg, text) {
    const target = document.getElementById(svg.dataset.status);
    if (target) target.textContent = text;
  }
  function settle(svg) {
    const state = instances.get(svg);
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
    draw(svg, end);
    svg.dataset.phase = 'settled';
  }
  function play(svg) {
    settle(svg);
    if (reducedMotion.matches) {
      status(svg, 'Reduced motion is on. The final V is shown.');
      return;
    }
    const state = instances.get(svg);
    let started;
    draw(svg, start);
    svg.dataset.phase = 'start';
    status(svg, 'Original lines');
    function frame(now) {
      if (started === undefined) started = now;
      const elapsed = now - started;
      const next = start.map((line, i) => {
        const t = Math.min(1, Math.max(0, (elapsed - 300 - lag[i]) / 1050));
        const eased = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
        return line.map((value,j) => Math.round((value+(end[i][j]-value)*eased)*1000)/1000);
      });
      draw(svg, next);
      if (elapsed >= 1440) {
        settle(svg);
        status(svg, 'Final V');
        return;
      }
      if (elapsed >= 300 && svg.dataset.phase !== 'moving') {
        svg.dataset.phase = 'moving';
        status(svg, 'Lines forming the V');
      }
      state.frame = requestAnimationFrame(frame);
    }
    state.frame = requestAnimationFrame(frame);
  }
  document.querySelectorAll('[data-voice-logo]').forEach(svg => {
    instances.set(svg, {frame:0});
    play(svg);
  });
  document.querySelectorAll('[data-logo-replay]').forEach(button => {
    button.addEventListener('click', () => {
      const svg = document.getElementById(button.dataset.logoReplay);
      if (instances.has(svg)) play(svg);
    });
  });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    instances.forEach((_,svg) => {
      settle(svg);
      status(svg, 'Reduced motion is on. The final V is shown.');
    });
  });
})();
