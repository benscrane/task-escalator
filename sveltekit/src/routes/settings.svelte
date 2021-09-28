<script context="module" lang="ts">
	import { authGuard } from '$lib/guards';

	export const load = async () => {
		return await authGuard('protected')();
	};
</script>

<script lang="ts"></script>

<div>
	<h2>Settings</h2>
</div>
