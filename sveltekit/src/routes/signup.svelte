<script context="module" lang="ts">
	import { authGuard } from '$lib/guards';

	export const load = async () => {
		return await authGuard('publicOnly')();
	};
</script>

<script lang="ts">
	import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import authStore from '$lib/authStore';

	let email: string;
	let password: string;
	let loading = false;

	$: emailValid = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
		email
	);

	$: passwordValid = password && password.length >= 6;

	const registerWithPassword = async () => {
		const auth = getAuth();
		try {
			loading = true;
			await createUserWithEmailAndPassword(auth, email, password);
		} catch (e) {
			console.log(e);
		} finally {
			loading = false;
		}
	};

	const onKeyPress = async (event) => {
		if (event.charCode === 13 && emailValid && passwordValid) {
			registerWithPassword();
		}
	};

	const sub = authStore.subscribe(async (info) => {
		if (info.isLoggedIn) {
			await goto('/dashboard');
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
				<input
					class="input"
					type="email"
					bind:value={email}
					id="emailInput"
					on:keypress={onKeyPress}
				/>
			</div>
		</div>

		<div class="field">
			<label class="label" for="passwordInput">Password</label>
			<div class="control">
				<input
					class="input"
					type="password"
					bind:value={password}
					id="passwordInput"
					on:keypress={onKeyPress}
				/>
			</div>
		</div>

		<div class="field is-grouped is-grouped-centered">
			<div class="control">
				<button
					class="button is-primary"
					class:is-loading={loading}
					on:click={registerWithPassword}
					disabled={!emailValid || !passwordValid}>Sign Up</button
				>
			</div>
		</div>
	</div>
</div>
