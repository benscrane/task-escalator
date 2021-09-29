import authStore from '$lib/authStore';
import type { LoadOutput } from '@sveltejs/kit/types';

let auth = { ...authStore.initialState };
authStore.subscribe((authState) => (auth = authState));

type GuardType = 'publicOnly' | 'protected';

const authGuard = (guardType: GuardType) => async (): Promise<LoadOutput> => {
	const loggedIn = auth.isLoggedIn;

	if (guardType === 'protected') {
		if (!loggedIn) {
			return {
				redirect: '/login',
				status: 302
			};
		}
	} else if (guardType === 'publicOnly') {
		if (loggedIn) {
			return {
				redirect: '/dashboard',
				status: 302
			};
		}
	}

	return {};
};

export { authGuard };
