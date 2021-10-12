<script context="module">
	import { initializeApp } from '@firebase/app';
	import { browser } from '$app/env';

	export const load = async () => {
		if (browser) {
			initializeApp({
				apiKey: 'AIzaSyAxWJiSO-oWCCEopy1DdMqnEiDm0u1Cz6k',
				authDomain: 'taskalator.firebaseapp.com',
				databaseURL: 'https://taskalator.firebaseio.com',
				projectId: 'taskalator',
				storageBucket: 'taskalator.appspot.com',
				messagingSenderId: '359266108969'
			});
		} else {
		}

		return {
			props: {}
		};
	};
</script>

<script lang="ts">
	import Header from '$lib/header/Header.svelte';
	import { getAuth, onAuthStateChanged } from '@firebase/auth';
	import authStore from '$lib/authStore';
	import { onMount } from 'svelte';
	import '../app.css';

	onMount(() => {
		const auth = getAuth();
		onAuthStateChanged(auth, (user) => {
			const isLoggedIn = user !== null;
			authStore.set({
				isLoggedIn,
				user,
				firebaseControlled: true
			});
		});
	});
</script>

<Header />

<main class="container">
	<slot />
</main>

<style>
	/* main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 1024px;
		margin: 0 auto;
		box-sizing: border-box;
	} */
</style>
