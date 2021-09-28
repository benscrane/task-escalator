import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';

interface AuthState {
	isLoggedIn: boolean;
	user?: User;
	firebaseControlled: boolean; // do we need this?
}

const initialAuthState: AuthState = {
	isLoggedIn: false,
	firebaseControlled: false
};

const authStore = writable<AuthState>(initialAuthState);

export default {
	subscribe: authStore.subscribe,
	set: authStore.set,
	initialState: initialAuthState
};
