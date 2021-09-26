<script lang="ts">
	import { getStores } from '$app/stores';
	import authStore from '../../stores/authStore';
	import { getAuth, signOut } from 'firebase/auth';
	const logout = async () => {
		const auth = getAuth();
		await signOut(auth);
	};
</script>

<header>
	<div style="display: flex; flex-direction: column; justify-content: center;">
		<div>
			<a href="/">
				<img src="/icon_logo.png" alt="Task Escalator Logo" />
			</a>
		</div>
	</div>
	<nav>
		<ul>
			{#if $authStore.isLoggedIn}
				<li>
					<a href="/dashboard" class="button is-primary is-inverted no-background">Dashboard</a>
				</li>
				<li>
					<a href="/settings" class="button is-primary is-inverted no-background">Settings</a>
				</li>
				<li>
					<button class="button is-primary is-outlined" on:click={logout}>Logout</button>
				</li>
			{:else}
				<li>
					<a href="/login" class="button is-primary"> Login </a>
				</li>
				<li>
					<a href="/signup" class="button is-primary is-outlined">Sign Up</a>
				</li>
			{/if}
		</ul>
	</nav>
</header>

<style lang="scss">
	header {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem;
	}
	ul {
		display: flex;
		list-style: none;
	}
	li {
		margin-left: 0.5rem;
		margin-right: 0.5rem;
	}
	a {
		text-decoration: none;
		img {
			height: 2rem;
		}
	}
	.no-background {
		background-color: rgba(0, 0, 0, 0);

		&:hover {
			background-color: rgba(0, 0, 0, 0.08);
		}
	}
</style>
