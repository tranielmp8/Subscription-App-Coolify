import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { AUTH_CODE_EXPIRES_IN_SECONDS } from '$lib/server/auth';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		return redirect(302, '/dashboard');
	}

	return {
		codeExpiresIn: AUTH_CODE_EXPIRES_IN_SECONDS
	};
};
