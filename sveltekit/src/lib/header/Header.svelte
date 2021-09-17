<script lang="ts">
	import Button, { Label } from '@smui/button';

	const logout = () => {
		alert('Logging out');
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
			<li>
				<a href="/dashboard">
					<Button>
						<Label>Dashboard</Label>
					</Button>
				</a>
			</li>
			<li>
				<a href="/settings">
					<Button>
						<Label>Settings</Label>
					</Button>
				</a>
			</li>
			<li>
				<Button variant="outlined" on:click={logout}>
					<Label>Logout</Label>
				</Button>
			</li>
			<li>
				<a href="/login">
					<Button variant="raised">
						<Label>Login</Label>
					</Button>
				</a>
			</li>
			<li>
				<a href="/signup"
					><Button variant="outlined">
						<Label>Sign Up</Label>
					</Button></a
				>
			</li>
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
	a img {
		height: 2rem;
	}
</style>
