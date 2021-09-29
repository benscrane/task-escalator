<script context="module" lang="ts">
	import { authGuard } from '$lib/guards';

	export const load = async () => {
		return await authGuard('publicOnly')();
	};
</script>

<script lang="ts">
	import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import authStore from '$lib/authStore';

	let email: string;
	let password: string;
	let resetModalOpen = false;
	let loading = false;

	$: emailValid = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
		email
	);

	$: passwordValid = password && password.length >= 6;

	const loginWithPassword = async () => {
		const auth = getAuth();
		try {
			loading = true;
			await signInWithEmailAndPassword(auth, email, password);
		} catch (e) {
			console.log(e);
		} finally {
			loading = false;
		}
	};

	const resetPassword = async () => {
		const auth = getAuth();
		try {
			loading = true;
			await sendPasswordResetEmail(auth, email);
		} catch (e) {
			console.log(e);
		} finally {
			resetModalOpen = false;
			loading = false;
		}
	};

	const onKeyPress = async (event) => {
		if (event.charCode === 13 && emailValid) {
			if (resetModalOpen) {
				resetPassword();
			} else {
				if (passwordValid) {
					loginWithPassword();
				}
			}
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
					on:click={loginWithPassword}
					disabled={!emailValid || !passwordValid}>Login</button
				>
			</div>
		</div>
		<div class="field is-grouped is-grouped-centered">
			<div class="control">
				<button class="button is-text" on:click={() => (resetModalOpen = true)}
					>Reset Password</button
				>
			</div>
		</div>
	</div>
</div>

<div class="modal" class:is-active={resetModalOpen}>
	<div class="modal-background" on:click={() => (resetModalOpen = false)} />
	<div class="modal-content">
		<form class="box" on:submit|preventDefault={resetPassword}>
			<div class="field">
				<label class="label" for="resetEmailInput">Email</label>
				<div class="control">
					<input
						class="input"
						type="email"
						bind:value={email}
						id="resetEmailInput"
						on:keypress={onKeyPress}
					/>
				</div>
			</div>

			<div class="field is-grouped is-grouped-centered">
				<div class="control">
					<button
						class="button is-primary"
						class:is-loading={loading}
						type="submit"
						disabled={!emailValid}>Reset Password</button
					>
				</div>
			</div>
		</form>
	</div>
</div>
