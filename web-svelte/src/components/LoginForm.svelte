<form on:submit|preventDefault={dispatchLogin}>
    <div>
        <label for='email'>Email</label>
        <input type='email' id='email' />
    </div>
    <div>
        <label for='password'>Password</label>
        <input type='password' id='password' />
    </div>
    <div>
        <button type='submit'>Login</button>
    </div>
</form>

<script lang='ts'>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    const dispatchLogin = (event) => {
        const { email, password } = event.target.elements;
        dispatch('login', {
            email: email.value,
            password: password.value,
        });
    };
</script>