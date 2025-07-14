<script setup>
import { ref } from 'vue'

const theme = ref('light')
const drawer = ref(false)
</script>

<template>
  <v-responsive class="border rounded">
    <v-app :theme="theme">
      <!-- Navigation Drawer -->
      <v-navigation-drawer class="drawir" v-model="drawer" temporary>
        <v-list nav dense>
          <v-list-item to="/" title="Dashboard" prepend-icon="mdi-view-dashboard" />
          <v-list-item to="/transactions" title="Transactions" prepend-icon="mdi-table" />
        </v-list>
      </v-navigation-drawer>

      <!-- App Bar -->
      <v-app-bar class="px-3" color="orange-lighten-3" dark>
        <v-app-bar-nav-icon @click="drawer = !drawer" />

        <!-- Brand -->
        <v-toolbar-title class="font-weight-bold">
          <v-icon class="mr-2">mdi-hammer</v-icon>
          EvenPar
        </v-toolbar-title>

        <v-spacer></v-spacer>

        <!-- Theme Toggle -->
      </v-app-bar>

      <!-- Main Content -->
      <v-main class="main-bg">
        <v-container>
          <slot name="content"></slot>
        </v-container>
      </v-main>
    </v-app>
  </v-responsive>
</template>

<style scoped>
.main-bg {
  min-height: 100vh;
  background:
    radial-gradient(circle at 20% 30%, #ffe0b2 0%, transparent 40%),
    radial-gradient(circle at 80% 60%, #ffcc80 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, #ffd180 0%, #fffdf7 60%);
  background-color: #fffdf7; /* fallback */
  background-repeat: no-repeat;
  background-size: cover;
}

.drawir {
  background: linear-gradient(to bottom, #ffffff, #ffb74d); /* light to deeper orange */
  color: #000000; /* dark brown text for contrast */
}
</style>
