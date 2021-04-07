<nav>
    <span>Task Escalator</span>
    <div class="spacer"></div>
    <div>
        {#if $user}
            <button on:click={logout}>Logout</button>
        {/if}
    </div>
</nav>

<script lang='ts'>
    import { logout, user } from '../auth';
</script>

<style>
    nav {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }
    button {
        align-items: center;
        display: flex;
        flex-direction: row;
        justify-content: center;
    }

    .spacer {
        flex-grow: 1;
    }
</style>