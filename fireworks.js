// celebration.js - confetti-on-load + rising balloons (no click effects)
(function () {
  // --- CONFETTI POPPERS (paper fireworks) on page load ---
  function popConfettiBurst() {
    // Two directional bursts like party poppers
    confetti({
      particleCount: 90,
      spread: 70,
      startVelocity: 55,
      ticks: 140,
      origin: { x: 0.15, y: 0.8 },
      scalar: 0.9
    });
    confetti({
      particleCount: 90,
      spread: 70,
      startVelocity: 55,
      ticks: 140,
      origin: { x: 0.85, y: 0.8 },
      scalar: 0.9
    });

    // A center burst with mixed shapes
    confetti({
      particleCount: 140,
      spread: 90,
      startVelocity: 45,
      ticks: 160,
      origin: { x: 0.5, y: 0.6 },
      scalar: 1.0,
      colors: ['#ff7675','#fdcb6e','#55efc4','#74b9ff','#a29bfe','#ffeaa7','#fab1a0'],
    });
  }

  // Sequence: 3 waves within ~2.2s
  popConfettiBurst();
  setTimeout(popConfettiBurst, 800);
  setTimeout(popConfettiBurst, 1600);

  // --- BALLOONS ON LOAD (rise and fade, then auto-remove) ---
  const BALLOON_SVGS = [
    'assets/balloon-blue.svg',
    'assets/balloon-pink.svg'
  ];

function launchBalloons(count = 12) {
  const COLORS = ['#ff7675','#74b9ff','#ffeaa7','#55efc4','#a29bfe','#fd79a8','#fab1a0'];

  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'float-balloon';

    // random color
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    div.style.background = color;

    // randomize position/size/speed & sway
    const startX = 5 + Math.random() * 90;                // vw
    const size = 40 + Math.random() * 50;                 // px
    const dur = 4.5 + Math.random() * 2;                  // s (quick fade)
    const delay = Math.random() * 0.5;                    // s
    const drift = (Math.random() * 20 - 10).toFixed(1);   // px (overall drift)
    const sway = (4 + Math.random() * 6).toFixed(1);      // px (left-right sway amplitude)

    div.style.left = startX + 'vw';
    div.style.width = size + 'px';
    div.style.height = size * 1.3 + 'px';
    div.style.animationDelay = delay + 's';
    div.style.setProperty('--dur', dur + 's');
    div.style.setProperty('--drift', drift + 'px');
    div.style.setProperty('--sway', sway + 'px');

    document.body.appendChild(div);
    div.addEventListener('animationend', () => div.remove());
  }
}



  // launch balloons shortly after the first confetti for layering
  setTimeout(() => launchBalloons(12), 250);
})();
