import type { Directive } from 'vue';

// v-reveal: fade/rise an element in once, the first time it enters the viewport.
let io: IntersectionObserver | null = null;

function observer() {
  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io!.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  return io;
}

export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    el.classList.add('reveal');
    if (!('IntersectionObserver' in window)) {
      el.classList.add('in');
      return;
    }
    observer().observe(el);
  },
  unmounted(el) {
    io?.unobserve(el);
  },
};
