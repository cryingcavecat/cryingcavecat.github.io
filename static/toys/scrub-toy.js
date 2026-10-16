/* ==================================================================
   ScrubToy: drive a video's currentTime from user input.

   The video never "plays". Input sets a target progress (0..1) and a
   requestAnimationFrame loop eases the real progress toward it, then
   seeks the video there. Works forwards and backwards, any speed.

   REQUIREMENT: videos must be encoded with a keyframe on every frame,
   or seeking will stutter. See README for the ffmpeg command.

   Usage:
     ScrubToy({
       video: document.querySelector('video'),
       frame: document.querySelector('.frame'),   // element receiving pointer input
       mode: 'hold' | 'drag' | 'scroll',
       easeIn: 0.07,      // lerp while progress increases
       easeOut: 0.14,     // lerp while progress decreases
       dragRange: 260,    // drag mode: px of drag for full effect
       scrollPortion: 0.85, // scroll mode: fraction of page that maps to video
       onProgress: (p) => {} // optional, called every frame with 0..1
     });
   ================================================================== */
(function (global) {
  function ScrubToy(config) {
    const video = config.video;
    const frame = config.frame || video;
    const mode = config.mode || 'hold';
    const easeIn = config.easeIn ?? 0.07;
    const easeOut = config.easeOut ?? 0.14;
    const dragRange = config.dragRange ?? 260;
    const scrollPortion = config.scrollPortion ?? 0.85;
    const onProgress = config.onProgress || null;

    let duration = 0;
    let target = 0;
    let current = 0;
    let started = false;

    function tick() {
      const ease = target > current ? easeIn : easeOut;
      current += (target - current) * ease;
      if (duration > 0 && Math.abs(video.currentTime - current * duration) > 0.01) {
        video.currentTime = current * duration;
      }
      if (onProgress) onProgress(current);
      requestAnimationFrame(tick);
    }

    function init() {
      if (started || !video.duration) return;
      started = true;
      duration = video.duration;
      video.pause();
      if (mode === 'scroll') updateScroll();
      requestAnimationFrame(tick);
    }

    // Metadata may already be loaded before this script runs (cached file).
    video.addEventListener('loadedmetadata', init);
    if (video.readyState >= 1) init();

    // We only ever seek. If anything starts playback, stop it.
    video.addEventListener('play', function () { if (started) video.pause(); });

    // ---- hold: press = toward end, release = back to start ----------
    if (mode === 'hold') {
      frame.addEventListener('pointerdown', function (e) {
        frame.setPointerCapture(e.pointerId);
        target = 1;
      });
      const release = function () { target = 0; };
      frame.addEventListener('pointerup', release);
      frame.addEventListener('pointercancel', release);
    }

    // ---- drag: horizontal drag distance = progress -----------------
    if (mode === 'drag') {
      let dragging = false;
      let startX = 0;
      frame.addEventListener('pointerdown', function (e) {
        frame.setPointerCapture(e.pointerId);
        dragging = true;
        startX = e.clientX;
      });
      frame.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        target = Math.min(Math.abs(e.clientX - startX) / dragRange, 1);
      });
      const release = function () { dragging = false; target = 0; };
      frame.addEventListener('pointerup', release);
      frame.addEventListener('pointercancel', release);
    }

    // ---- scroll: page scroll position = progress -------------------
    function updateScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / (max * scrollPortion) : 0;
      target = Math.min(Math.max(p, 0), 1);
    }
    if (mode === 'scroll') {
      window.addEventListener('scroll', updateScroll, { passive: true });
      window.addEventListener('resize', updateScroll);
    }

    // iOS Safari only allows programmatic seeking after a gesture-play.
    const unlockTarget = mode === 'scroll' ? document : frame;
    const unlockEvent = mode === 'scroll' ? 'touchstart' : 'pointerdown';
    unlockTarget.addEventListener(unlockEvent, function () {
      video.play().then(function () { video.pause(); }).catch(function () {});
    }, { once: true });

    // Lets the page drive the toy too (keyboard controls on 011.sh).
    return {
      set: function (p) { target = Math.min(Math.max(p, 0), 1); },
      unlock: function () { video.play().then(function () { video.pause(); }).catch(function () {}); }
    };
  }

  global.ScrubToy = ScrubToy;
})(window);
