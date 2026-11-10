/**
 * Shared controls for the animated rule diagrams. Each diagram's root has
 * `data-anim` and contains a `data-anim-toggle` button. The root gets:
 * - `is-running` while it is on screen and not paused (CSS animations run only then),
 * - `is-still` for visitors who asked for reduced motion, until they press Play
 *   (CSS holds a frame that shows the whole play).
 */
export function setupAnimatedDiagrams() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll<HTMLElement>('[data-anim]:not([data-anim-ready])').forEach((root) => {
    root.dataset.animReady = '';
    const button = root.querySelector<HTMLButtonElement>('[data-anim-toggle]');
    let paused = reduce.matches;
    let played = false;
    let visible = false;
    const render = () => {
      root.classList.toggle('is-running', visible && !paused);
      root.classList.toggle('is-still', paused && reduce.matches && !played);
      if (button) button.textContent = paused ? 'Play animation' : 'Pause animation';
    };
    button?.addEventListener('click', () => {
      paused = !paused;
      if (!paused) played = true;
      render();
    });
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        render();
      },
      { threshold: 0.3 },
    ).observe(root);
    render();
  });
}
