import { eq, isNull } from 'drizzle-orm';
import { APIError } from 'better-auth/api';
import { env } from '$env/dynamic/private';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user, verification } from '$lib/server/db/auth.schema';
import { subscriptions } from '$lib/server/db/schema';
import { sendAuthCodeEmail } from '$lib/server/resend';

export function authError(error: unknown, fallback: string) {
	if (error instanceof APIError) return error.message || fallback;
	if (error instanceof Error) return error.message || fallback;
	return fallback;
}

export async function sendLoginCode({ email, headers }: { email: string; headers: Headers }) {
	await db.delete(verification).where(eq(verification.identifier, `sign-in-otp-${email}`));

	const otp = await auth.api.createVerificationOTP({
		body: { email, type: 'sign-in' },
		headers
	});

	await sendAuthCodeEmail({ to: email, otp });
}

async function claimLegacySubscriptions(authUser: { id: string; email: string }) {
	const legacyOwnerEmail = env.LEGACY_OWNER_EMAIL?.trim().toLowerCase();

	if (!legacyOwnerEmail || authUser.email.toLowerCase() !== legacyOwnerEmail) return;

	await db
		.update(subscriptions)
		.set({ userId: authUser.id, updatedAt: new Date() })
		.where(isNull(subscriptions.userId));
}

export async function verifyLoginCode({
	email,
	name,
	otp,
	headers
}: {
	email: string;
	name: string;
	otp: string;
	headers: Headers;
}) {
	const result = await auth.api.signInEmailOTP({
		body: { email, otp },
		headers
	});

	if (name && !result.user.name) {
		await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, result.user.id));
	}

	await claimLegacySubscriptions(result.user);
	return result.user;
}
