<script lang="ts">
	import Navbar from './components/Navbar.svelte';
	import LoginForm from './components/LoginForm.svelte';
	import { user } from './auth';


</script>

<div>
<Navbar/>
<main>
	<div>
		{#if $user}
			<h2>Logged in</h2>
		{:else}
			<h2>Logged out</h2>
			<LoginForm />
		{/if}
	</div>
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