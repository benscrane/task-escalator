<nav>
    <span>Task Escalator</span>
    {#if $user}
        <button on:click={logout}>Logout</button>
    {/if}
</nav>

<script lang='ts'>
    import { logout, user } from '../auth';
</script>