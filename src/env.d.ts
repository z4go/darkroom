/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module 'vue' {
  interface GlobalDirectives {
    vReveal: typeof import('./directives/reveal').vReveal;
  }
}

export {};
