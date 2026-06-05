import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		return redirect(302, '/demo/better-auth');
	}
	return redirect(302, '/login');
};

export const actions: Actions = {
	signInEmail: async () => redirect(302, '/login'),
	signUpEmail: async () => redirect(302, '/login')
};
