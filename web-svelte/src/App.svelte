<script lang="ts">
	import Navbar from './components/Navbar.svelte';
	import LoginForm from './components/LoginForm.svelte';
	import { loginWithEmailPassword, user, logout } from './auth';

	let error = null;

	const loginHandler = async (event) => {
		const { email, password } = event.detail;
		error = null;
		try {
			await loginWithEmailPassword(email, password);
		} catch (err) {
			error = err;
		}
	};

</script>

<div>
<Navbar/>
<main>
	{#if error}
		<div>{error.message}</div>
	{/if}
	<div>
		{#if $user}
			<h2>Logged in</h2>
			<h3>{ $user.email }</h3>
			<button on:click={logout}>Logout</button>
		{:else}
			<h2>Logged out</h2>
		{/if}
	</div>
	<LoginForm on:login={loginHandler} />
</main>
</div>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>