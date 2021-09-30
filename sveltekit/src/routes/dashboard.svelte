<script context="module" lang="ts">
	import { authGuard } from '$lib/guards';

	export const load = async () => {
		return await authGuard('protected')();
	};
</script>

<script lang="ts">
	import { collection, query, getFirestore, limit, getDocs } from '@firebase/firestore';
	import { onMount } from 'svelte';

	let recentEscalatedTasks = [];

	const db = getFirestore();

	const userId: string = '2On8T7i7rjgtumcfgJtsNPOOkD12';

	onMount(async () => {
		const escalatedTasksRef = collection(db, 'users', userId, 'escalatedTasks');
		const q = query(escalatedTasksRef, limit(20));
		const documentSnapshots = await getDocs(q);
		console.log(documentSnapshots[0]);
	});
</script>

<div>
	<h2>Dashboard</h2>
</div>
