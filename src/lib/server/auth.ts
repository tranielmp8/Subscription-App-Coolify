import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { sendAuthCodeEmail } from '$lib/server/resend';

export const AUTH_CODE_EXPIRES_IN_SECONDS = 120;

const trustedOrigins = (env.BETTER_AUTH_TRUSTED_ORIGINS ?? env.ORIGIN ?? '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	trustedOrigins,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	session: {
		expiresIn: 60 * 60 * 24 * 10,
		updateAge: 60 * 60 * 24
	},
	emailAndPassword: { enabled: false },
	plugins: [
		emailOTP({
			otpLength: 6,
			expiresIn: AUTH_CODE_EXPIRES_IN_SECONDS,
			allowedAttempts: 3,
			storeOTP: 'hashed',
			async sendVerificationOTP({ email, otp }) {
				await sendAuthCodeEmail({ to: email, otp });
			}
		}),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
