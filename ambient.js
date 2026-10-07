/* ══════════════════════════════════════════════
   FORMES ANIMÉES EN FOND (commun à toutes les pages)
   Petites formes en parallaxe derrière le contenu :
   elles défilent à des vitesses différentes au scroll,
   suivent légèrement la souris et s'écartent doucement
   du curseur. Immobiles si l'utilisateur a demandé
   moins d'animations.
══════════════════════════════════════════════ */
(function AmbientShapes() {
  const canvas = document.createElement('canvas');
  canvas.id = 'ambient-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed; inset:0; width:100%; height:100%; z-index:-1; pointer-events:none;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = ['#6366f1', '#8b5cf6', '#c084fc', '#a5b4fc', '#7c3aed'];
  const kinds  = ['dot', 'ring', 'triangle', 'square', 'plus'];
  const MARGIN = 40;

  let W, H, shapes = [];
  let mouseX = -9999, mouseY = -9999;   // position réelle du curseur
  let tx = 0, ty = 0, mx = 0, my = 0;   // décalage souris (-1 → 1), cible / lissé
  let scrollY = window.scrollY, smoothScroll = scrollY;

  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(60, Math.max(24, (W * H) / 26000)));
    shapes = Array.from({ length: count }, () => {
      const depth = 0.2 + Math.random() * 0.8;   // 0.2 = loin, 1 = proche
      return {
        x: Math.random() * W,
        y: Math.random() * (H + MARGIN * 2),
        depth,
        size:  4 + depth * 10,
        kind:  kinds[Math.floor(Math.random() * kinds.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.14 + depth * 0.28,
        rot:   Math.random() * Math.PI * 2,
        spin:  (Math.random() - 0.5) * 0.006,
        vx:    (Math.random() - 0.5) * 0.15,
        vy:    (Math.random() - 0.5) * 0.15,
        ox: 0, oy: 0,   // décalage lissé dû au curseur
      };
    });
  }

  function drawShape(s, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = s.alpha;
    ctx.strokeStyle = ctx.fillStyle = s.color;
    ctx.lineWidth = 1.3;
    const r = s.size;
    ctx.beginPath();
    if (s.kind === 'dot') {
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.kind === 'ring') {
      ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (s.kind === 'triangle') {
      ctx.moveTo(0, -r * 0.7);
      ctx.lineTo(r * 0.62, r * 0.45);
      ctx.lineTo(-r * 0.62, r * 0.45);
      ctx.closePath();
      ctx.stroke();
    } else if (s.kind === 'square') {
      ctx.strokeRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9);
    } else {
      ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0);
      ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function frame() {
    // Lissage de la souris et du scroll
    mx += (tx - mx) * 0.03;
    my += (ty - my) * 0.03;
    smoothScroll += (scrollY - smoothScroll) * 0.1;

    ctx.clearRect(0, 0, W, H);
    const spanY = H + MARGIN * 2;
    const spanX = W + MARGIN * 2;

    shapes.forEach(s => {
      if (!reduceMotion) {
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.spin;
      }
      // Parallaxe : les formes proches défilent plus vite que les lointaines
      let x = s.x + mx * 20 * s.depth;
      let y = s.y - smoothScroll * 0.35 * s.depth + my * 14 * s.depth;
      x = ((x + MARGIN) % spanX + spanX) % spanX - MARGIN;
      y = ((y + MARGIN) % spanY + spanY) % spanY - MARGIN;

      // Les formes s'écartent doucement du curseur :
      // poussée progressive (courbe douce) puis rattrapage lent
      let pushX = 0, pushY = 0;
      const dx = x - mouseX, dy = y - mouseY;
      const d = Math.hypot(dx, dy);
      if (d < 170 && d > 0.1) {
        const f = 1 - d / 170;
        const strength = f * f * (3 - 2 * f) * 12 * s.depth;
        pushX = (dx / d) * strength;
        pushY = (dy / d) * strength;
      }
      s.ox += (pushX - s.ox) * 0.035;
      s.oy += (pushY - s.oy) * 0.035;
      x += s.ox;
      y += s.oy;

      drawShape(s, x, y, s.rot + smoothScroll * 0.0015 * s.depth);
    });

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    tx = (e.clientX / W - 0.5) * 2;
    ty = (e.clientY / H - 0.5) * 2;
  });
  document.addEventListener('mouseleave', () => { mouseX = mouseY = -9999; tx = ty = 0; });
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    if (reduceMotion) { smoothScroll = scrollY; frame(); }
  }, { passive: true });
  window.addEventListener('resize', () => { build(); if (reduceMotion) frame(); });

  build();
  frame();
})();
