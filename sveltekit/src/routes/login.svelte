<script lang="ts">
	import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import authStore from '../stores/authStore';

	let email: string;
	let password: string;

	async function loginWithPassword() {
		const auth = getAuth();
		try {
			await signInWithEmailAndPassword(auth, email, password);
		} catch (e) {
			console.log(e);
		}
	}

	const sub = authStore.subscribe(async (info) => {
		if (info.isLoggedIn) {
			await goto('/');
		}
	});

	onDestroy(() => {
		sub();
	});
</script>

<div class="columns is-centered mt-4">
	<div class="column is-half">
		<div class="field">
			<label class="label" for="emailInput">Email</label>
			<div class="control">
				<input class="input" type="email" bind:value={email} id="emailInput" />
			</div>
		</div>

		<div class="field">
			<label class="label" for="passwordInput">Password</label>
			<div class="control">
				<input class="input" type="password" bind:value={password} id="passwordInput" />
			</div>
		</div>

		<div class="field is-grouped is-grouped-centered">
			<div class="control">
				<button class="button is-primary" on:click={loginWithPassword}>Login</button>
			</div>
		</div>
	</div>
</div>
