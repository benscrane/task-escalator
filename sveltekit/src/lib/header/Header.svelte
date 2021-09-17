<script lang="ts">
	import { page } from '$app/stores';
	import logo from './svelte-logo.svg';
	import Button, { Label } from '@smui/button';
</script>

<header>
	<div>
		<span>Task Escalator Icon</span>
	</div>
	<nav>
		<ul>
			<Button>
				<Label>Dashboard</Label>
			</Button>
			<li class="active"><a href="/login">Login</a></li>
			<li><a href="/signup">Sign Up</a></li>
		</ul>
	</nav>
</header>

<style>
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
	}
	.active {
		text-decoration: underline;
	}
</style>
