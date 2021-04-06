<script lang='ts'>
    import firebase from 'firebase/app';
    import 'firebase/auth';

    const auth = firebase.auth();

    let user = null;

    export let useRedirect = false;

    const userMapper = claims => ({
        id: claims.user_id,
        name: claims.name,
        email: claims.email,
        picture: claims.picture,
    });

    export const loginWithEmailPassword = (email: string, password: string) =>
        auth.signInWithEmailAndPassword(email, password);

    export const logout = () => auth.signOut();

    auth.onAuthStateChanged(async fireUser => {
        if (fireUser) {
            const token = await fireUser.getIdTokenResult();
            user = userMapper(token.claims);
        } else {
            user = null;
        }
    });

    $: loggedIn = user !== null;
</script>

<div>
    <slot {user} {loggedIn} {loginWithEmailPassword} {logout} />
</div>
