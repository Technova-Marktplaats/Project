<script setup>
defineProps({
  msg: String,
});
function loadImage(name, ext){
  return new URL(`../assets/${name}.${ext}` , import.meta.url).href
}

import '../assets/styless/header.css'
</script>


<template>
  <nav class="nav-bar">
    <div class="nav-left">
      <img class="logo" :src="loadImage('logo' , 'png')" alt="switch-logo">
      <div class="nav-home">
        <h1 class="nav-link">Home</h1>
      </div>
    </div>

    <div class="nav-right">
      <div class="nav-link">Cart</div>
      <div class="nav-icon">
        <img :src="loadImage('icon', 'svg')" alt="switch-nav-icon">
      </div>
      <div class="nav-link">
        login/register
        <div class="nav-icon">
          <img :src="loadImage('icon2', 'svg')" alt="switch-nav-icon">
        </div>
      </div>
    </div>
  </nav>
</template>