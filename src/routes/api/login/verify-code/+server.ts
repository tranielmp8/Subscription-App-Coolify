import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authError, verifyLoginCode } from '$lib/server/auth-code';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}));
	const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
	const name = typeof body.name === 'string' ? body.name.trim() : '';
	const otp = typeof body.otp === 'string' ? body.otp.trim() : '';

	if (!email || !otp) {
		return json({ message: 'Email and code are required' }, { status: 400 });
	}

	try {
		await verifyLoginCode({ email, name, otp, headers: request.headers });
	} catch (error) {
		return json({ message: authError(error, 'Invalid or expired code') }, { status: 400 });
	}

	return json({ success: true });
};
