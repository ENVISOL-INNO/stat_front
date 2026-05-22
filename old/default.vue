<template>
  <v-app>
    <v-app-bar color="primary">
      <div v-if="mode == 'dev'">
        Envisol test
      </div>
      <div v-else>
        <NuxtImg src="/2024_Logo_blanc_sans_site.png" height="60" contain></NuxtImg>
      </div>
      <v-spacer></v-spacer>
      <div v-if="mode == 'spectro'">
        <v-switch v-model="storeNav.mode_spectro" color="primary" label="Spectro"></v-switch>
      </div>
      <!-- <div v-else>mode : {{mode}}</div> -->
      <v-btn color="white" @click="lets_sign_out()">Déconnexion</v-btn>
      <!-- <div>
        You are currently {{ status }}.
      </div> -->
    </v-app-bar>

    <v-main>
      <v-alert v-if="mode == 'prod'" border="bottom" colored-border color="blue-grey" type="warning" elevation="2">
        Ces outils permettent de caractériser des signatures géochimiques et/ou l'impact de paramètres extérieurs
        (lithologies, profondeur)
        sur la distribution des polluants.<br>
        Il est nécessaire d'évaluer la pertinence des données utilisées : en particulier en fonction des zones à
        risques,
        de la présence de sources distinctes, etc.<br>
        Prenez le temps d'interpréter vos données au regard de ces éléments avant de réaliser les analyses
        statistiques.<br>
        Lors du calcul de signature géochimique par exemple, veillez notamment à n'inclure qu'une unique source de
        polluant dans vos données.
      </v-alert>
      <div v-if="status == 'authenticated'">
        <NuxtPage />
      </div>
      <div v-else> <v-btn color="primary" block size="x-large" @click="lets_sign_in()">Connexion</v-btn> </div>
    </v-main>
  </v-app>
</template>


<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const mode = runtimeConfig.public.mode;

const {
  status,
  data,
  lastRefreshedAt,
  getCsrfToken,
  getProviders,
  getSession,
  signIn,
  signOut
} = useAuth()

async function lets_sign_in() {
  console.log("trying to sign in");
  await signIn("auth0", {}, { "prompt": "login" })
  // see:
  // https://github.com/sidebase/nuxt-auth/blob/main/src/runtime/composables/authjs/useAuth.ts
  // l65  : signIn(provider, options, authorizationParams)
  // authorizationParams let's you define how the app asks the user to login
  // setting prompt to login makes it always ask the login/password rather than automatically reconnecting previous user
}

async function lets_sign_out() {
  console.log("trying to sign in");
  await signOut()
}

import { useMyNavStore } from '#build/imports';
const storeNav = useMyNavStore();

</script>