<script lang="ts">
	import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	// import authStore from '../stores/authStore';

	let email: string;
	let password: string;

	async function loginWithPassword() {
		const auth = getAuth();
		try {
			alert(`${email}:${password}`);
			await signInWithEmailAndPassword(auth, email, password);
		} catch (e) {
			console.log(e);
		}
	}

	// const sub = authStore.subscribe(async (info) => {
	// 	if (info.isLoggedIn) {
	// 		await goto('/');
	// 	}
	// });

	// onDestroy(() => {
	// 	sub();
	// });
</script>

<div class="field">
	<label class="label">Name</label>
	<div class="control">
		<input class="input" type="text" placeholder="Text input" />
	</div>
</div>
