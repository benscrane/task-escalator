<script context="module" lang="ts">
	import { authGuard } from '$lib/guards';

	export const load = async () => {
		return await authGuard('protected')();
	};
</script>

<script lang="ts">
	import { collection, query, getFirestore, getDocs } from '@firebase/firestore';
	import { onMount, onDestroy } from 'svelte';
	import authStore from '$lib/authStore';

	let recentEscalatedTasks = [];
	$: escalatedCount = recentEscalatedTasks.length;

	const db = getFirestore();

	let userId: string = '';

	const sub = authStore.subscribe(async (info) => {
		userId = info.user.uid;
	});

	onMount(async () => {
		const escalatedTasksRef = collection(db, 'users', userId, 'escalatedTasks');
		const q = query(escalatedTasksRef);
		const documentSnapshots = await getDocs(q);
		documentSnapshots.forEach((doc) => {
			recentEscalatedTasks = [doc.data(), ...recentEscalatedTasks];
		});
	});

	onDestroy(() => {
		sub();
	});
</script>

<div>
	<h2>Dashboard</h2>
	<p>{escalatedCount} tasks have been escalated for you</p>
	<ul>
		{#each recentEscalatedTasks.slice(0, 9) as escalatedTask}
			<li>{escalatedTask.content}</li>
		{/each}
	</ul>
</div>
