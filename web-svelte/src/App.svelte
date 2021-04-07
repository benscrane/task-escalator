<script lang="ts">
	// import firebase from 'firebase/app';
	import './firebase/setup';
	import Navbar from './components/Navbar.svelte';
	// import Auth from './components/Auth.svelte';
	import LoginForm from './components/LoginForm.svelte';
	// import { initAuth } from './auth';
	import { loginWithEmailPassword, user, logout } from './auth';

	// const firebaseConfig = {
	// 	apiKey: "AIzaSyAxWJiSO-oWCCEopy1DdMqnEiDm0u1Cz6k",
	// 	authDomain: "taskalator.firebaseapp.com",
	// 	databaseURL: "https://taskalator.firebaseio.com",
	// 	projectId: "taskalator",
	// 	storageBucket: "taskalator.appspot.com",
	// 	messagingSenderId: "359266108969"
	// };
	// firebase.initializeApp(firebaseConfig);

	// const { loginWithEmailPassword, user, logout } = initAuth();

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
	<!-- <Auth
		useRedirect={true}
		let:user
		let:loggedIn
		bind:loginWithEmailPassword
		let:logout
	> -->
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
<!-- </Auth> -->
</div>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>