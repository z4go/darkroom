import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles.css';

import { createApp, type Component } from 'vue';
import { vReveal } from './directives/reveal';

/** Mounts a page component with the shared fonts, styles and directives. */
export function createSite(page: Component) {
  const app = createApp(page);
  app.directive('reveal', vReveal);
  app.mount('#app');
  return app;
}
