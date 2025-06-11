<script setup>
import navbar from './navbar.vue'
import '../assets/styless/mainstyles.css'
</script>
<template>
  <navbar></navbar>

  <div class="search-bar-wrapper">
    <div class="box">
      <div class="categories">
          <ul class="categories-list">
            <li>
              <label for="cars"></label>
              <select name="cars" id="cars">
                <option value="volvo">Alle Categorien</option>
                <option value="volvo">Beeld en Geluid</option>
                <option value="saab">Gamen</option>
                <option value="opel">Deiren</option>
                <option value="audi">Gereegdschap</option>
                <option value="muziek">muziek</option>
              </select>
            </li>
            <li>Beeld en Geluid</li>
            <li>Game</li>
            <li>Dieren</li>
            <li>Gereedschap</li>

            <div class="search-box">
              <div class="group">
                <svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><g><path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path></g></svg>
                <input placeholder="Search" type="search" class="input">
              </div>
            </div>
          </ul>
      </div>
    </div>
  </div>
</template>