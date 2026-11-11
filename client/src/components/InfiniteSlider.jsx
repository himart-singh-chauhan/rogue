import React, { useEffect, useRef } from 'react';

/**
 * Endless auto-scrolling row of cards that members can also drag / swipe by hand.
 * - Scrolls on its own; pauses while hovered, touched or dragged, then carries on.
 * - Drag with a finger or the mouse to move to the card you want (vertical page scroll still works).
 * - A drag never opens the card under the finger; a plain tap/click still does.
 * - Respects "reduce motion": no auto-scroll, dragging still works.
 */
export default function InfiniteSlider({ children, gap = 32, speed = 40, reverse = false, cardWidth = "300px" }) {
  const originalChildren = React.Children.toArray(children);
  const originalCount = originalChildren.length;
  const trackRef = useRef(null);
  const state = useRef({ offset: 0, dragging: false, startX: 0, startY: 0, startOffset: 0, moved: false, paused: false, axis: null, pointerId: null });

  const cardWidthNum = parseInt(cardWidth, 10) || 300;
  const loopWidth = originalCount * (cardWidthNum + gap);
  // Enough copies to fill wide screens; the offset wraps every loopWidth so it never runs out
  const copies = Math.max(3, Math.ceil(3840 / Math.max(1, loopWidth)) + 2);
  const duplicatedChildren = originalCount ? Array(copies).fill(originalChildren).flat() : [];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loopWidth) return undefined;
    const s = state.current;
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pxPerSecond = loopWidth / Math.max(1, speed);
    const wrap = (x) => { let v = x % loopWidth; if (v > 0) v -= loopWidth; return v; };
    const paint = () => { track.style.transform = `translate3d(${s.offset}px, 0, 0)`; };
    if (reverse) s.offset = -loopWidth / 2;
    paint();

    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      if (!reduceMotion && !s.dragging && !s.paused) {
        s.offset = wrap(s.offset + (reverse ? 1 : -1) * pxPerSecond * dt);
        paint();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      s.dragging = true; s.moved = false; s.axis = null;
      s.startX = e.clientX; s.startY = e.clientY; s.startOffset = s.offset; s.pointerId = e.pointerId;
    };
    const onMove = (e) => {
      if (!s.dragging || e.pointerId !== s.pointerId) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      if (!s.axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (s.axis === 'x') { try { track.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
      }
      if (s.axis === 'y') { s.dragging = false; return; } // let the page scroll vertically
      if (s.axis === 'x') {
        s.moved = true;
        s.offset = wrap(s.startOffset + dx);
        paint();
      }
    };
    const onUp = (e) => {
      if (e.pointerId !== s.pointerId) return;
      s.dragging = false;
      try { track.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    // Swallow the click that ends a drag so a swipe doesn't open a card
    const onClickCapture = (e) => { if (s.moved) { e.preventDefault(); e.stopPropagation(); s.moved = false; } };
    const pause = () => { s.paused = true; };
    const resume = () => { s.paused = false; };

    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onUp);
    track.addEventListener('pointercancel', onUp);
    track.addEventListener('click', onClickCapture, true);
    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('touchend', resume, { passive: true });
    const blockImgDrag = (e) => e.preventDefault();
    track.addEventListener('dragstart', blockImgDrag);

    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener('pointerdown', onDown);
      track.removeEventListener('pointermove', onMove);
      track.removeEventListener('pointerup', onUp);
      track.removeEventListener('pointercancel', onUp);
      track.removeEventListener('click', onClickCapture, true);
      track.removeEventListener('mouseenter', pause);
      track.removeEventListener('mouseleave', resume);
      track.removeEventListener('touchstart', pause);
      track.removeEventListener('touchend', resume);
      track.removeEventListener('dragstart', blockImgDrag);
    };
  }, [loopWidth, speed, reverse]);

  if (originalCount === 0) return null;

  return (
    <div className="infinite-slider-container" style={{ overflow: 'hidden', width: '100%' }} aria-roledescription="carousel">
      <div
        ref={trackRef}
        className="infinite-slider-track"
        style={{ display: 'flex', gap: `${gap}px`, width: 'max-content', cursor: 'grab', touchAction: 'pan-y', userSelect: 'none', willChange: 'transform' }}
      >
        {duplicatedChildren.map((child, index) => (
          <div key={index} style={{ flexShrink: 0, width: cardWidth }} aria-hidden={index >= originalCount ? true : undefined}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
