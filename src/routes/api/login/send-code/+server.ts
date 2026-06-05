import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AUTH_CODE_EXPIRES_IN_SECONDS } from '$lib/server/auth';
import { authError, sendLoginCode } from '$lib/server/auth-code';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}));
	const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

	if (!email) {
		return json({ message: 'Email is required' }, { status: 400 });
	}

	try {
		await sendLoginCode({ email, headers: request.headers });
	} catch (error) {
		return json({ message: authError(error, 'Could not send verification code') }, { status: 400 });
	}

	return json({
		message: `Code sent to ${email}`,
		codeExpiresIn: AUTH_CODE_EXPIRES_IN_SECONDS
	});
};
