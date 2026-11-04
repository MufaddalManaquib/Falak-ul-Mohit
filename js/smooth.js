// Smoothed wheel scrolling for a scrolling element (the way smooth-scroll libraries such as Lenis work):
// mouse-wheel notches are turned into an eased glide; trackpads and touch keep their native, already smooth scrolling.
export function smoothWheel(el, ease = 0.11) {
  let target = el.scrollTop, cur = target, active = false;
  const step = () => {
    cur += (target - cur) * ease;
    if (Math.abs(target - cur) < 0.4) { cur = target; active = false; }
    el.scrollTop = cur;
    if (active) requestAnimationFrame(step);
  };
  el.addEventListener('wheel', e => {
    if (e.ctrlKey || e.defaultPrevented) return;
    if (e.target.closest && e.target.closest('input,select,textarea,.wfail')) return;
    let dy = e.deltaY; if (e.deltaMode === 1) dy *= 33; else if (e.deltaMode === 2) dy *= el.clientHeight;
    const notch = e.deltaMode !== 0 || Math.abs(dy) >= 50;        // a mouse wheel, not a trackpad
    if (!notch) { if (active) { active = false; } target = cur = el.scrollTop; return; }
    e.preventDefault();
    if (!active) { target = cur = el.scrollTop; }
    const max = el.scrollHeight - el.clientHeight;
    target = Math.max(0, Math.min(max, target + dy * 1.1));
    if (!active) { active = true; requestAnimationFrame(step); }
  }, { passive: false });
  // keyboard, scrollbar or touch scrolling: follow it
  el.addEventListener('scroll', () => { if (!active) target = cur = el.scrollTop; }, { passive: true });
  return { stop() { active = false; target = cur = el.scrollTop; } };
}
