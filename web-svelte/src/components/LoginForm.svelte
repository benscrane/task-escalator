<script lang='ts'>
    import { loginWithEmailPassword } from '../auth';

    let error: null;

    const loginUser = async (event) => {
        const { email, password } = event.target.elements;

        error = null;
        try {
            await loginWithEmailPassword(email.value, password.value);
        } catch (err) {
            error = err;
        }
    };
</script>

<form on:submit|preventDefault={loginUser}>
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
    {#if error}
        <div>
            <p>{ error.message }</p>
        </div>
    {/if}
</form>
