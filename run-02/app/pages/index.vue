// The root URL redirects to the bench page; this run has no other screen.
<script setup lang="ts">
// navigateTo is a Nuxt helper that works on the server and in the browser.
await navigateTo('/bench')
</script>

<template>
  <p>Opening the bench…</p>
</template>
