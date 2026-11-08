<template>
  <section class="panel" aria-label="Loading" aria-busy="true">
    <div class="panel-head"><p class="title-3">Device</p></div>
    <div class="panel-body skeleton"><i v-for="n in 8" :key="n" /></div>
  </section>
</template>
