import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { subscriptions, subscriptionCredentials, notificationSettings, tags, subscriptionTags } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth-guard';
import { and, asc, eq } from 'drizzle-orm';
import { encrypt, decrypt } from '$lib/server/crypto';
import { getTagColor } from '$lib/utils/tags';

async function syncTags(subscriptionId: string, tagNames: string[]) {
	await db.delete(subscriptionTags).where(eq(subscriptionTags.subscriptionId, subscriptionId));
	for (const raw of tagNames) {
		const name = raw.trim();
		if (!name) continue;
		await db.insert(tags).values({ name, color: getTagColor(name) }).onConflictDoNothing();
		const [tag] = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, name)).limit(1);
		if (tag) {
			await db.insert(subscriptionTags).values({ subscriptionId, tagId: tag.id }).onConflictDoNothing();
		}
	}
}

export async function load({ params, locals }) {
	const user = requireUser(locals);

	const [row] = await db
		.select({ subscription: subscriptions, credentials: subscriptionCredentials, notifications: notificationSettings })
		.from(subscriptions)
		.leftJoin(subscriptionCredentials, eq(subscriptions.id, subscriptionCredentials.subscriptionId))
		.leftJoin(notificationSettings, eq(subscriptions.id, notificationSettings.subscriptionId))
		.where(and(eq(subscriptions.id, params.id), eq(subscriptions.userId, user.id)));

	if (!row) throw error(404, 'Subscription not found');

	const subTags = await db.query.subscriptionTags.findMany({
		where: eq(subscriptionTags.subscriptionId, params.id),
		with: { tag: true }
	});

	const allTags = await db
		.selectDistinct({ id: tags.id, name: tags.name, color: tags.color, createdAt: tags.createdAt })
		.from(tags)
		.innerJoin(subscriptionTags, eq(tags.id, subscriptionTags.tagId))
		.innerJoin(subscriptions, eq(subscriptionTags.subscriptionId, subscriptions.id))
		.where(eq(subscriptions.userId, user.id))
		.orderBy(asc(tags.name));

	let password = '';
	if (row.credentials?.encryptedPassword) {
		try { password = decrypt(row.credentials.encryptedPassword); } catch { password = ''; }
	}

	return {
		subscription: row.subscription,
		credentials: row.credentials ? { ...row.credentials, password } : null,
		notifications: row.notifications,
		currentTagNames: subTags.map((st) => st.tag.name),
		allTags
	};
}

export const actions = {
	default: async ({ params, request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();

		const [existing] = await db
			.select({ id: subscriptions.id })
			.from(subscriptions)
			.where(and(eq(subscriptions.id, params.id), eq(subscriptions.userId, user.id)))
			.limit(1);

		if (!existing) return fail(404, { error: 'Not found' });

		const name = (data.get('name') as string)?.trim();
		const dueDate = data.get('due_date') as string;

		if (!name) return fail(400, { error: 'Name is required' });
		if (!dueDate) return fail(400, { error: 'Due date is required' });

		await db.update(subscriptions).set({
			name,
			description: (data.get('description') as string)?.trim() || null,
			amount: (data.get('amount') as string)?.trim() || null,
			currency: (data.get('currency') as string) || 'USD',
			billingCycle: (data.get('billing_cycle') as string) || 'monthly',
			dueDate,
			websiteUrl: (data.get('website_url') as string)?.trim() || null,
			category: (data.get('category') as string) || 'other',
			updatedAt: new Date()
		}).where(and(eq(subscriptions.id, params.id), eq(subscriptions.userId, user.id)));

		const username = (data.get('username') as string)?.trim();
		const password = (data.get('password') as string)?.trim();
		const notes = (data.get('notes') as string)?.trim();

		if (username || password || notes) {
			await db.insert(subscriptionCredentials)
				.values({ subscriptionId: params.id, username: username || null, encryptedPassword: password ? encrypt(password) : null, notes: notes || null })
				.onConflictDoUpdate({
					target: subscriptionCredentials.subscriptionId,
					set: { username: username || null, encryptedPassword: password ? encrypt(password) : null, notes: notes || null, updatedAt: new Date() }
				});
		}

		const notifEnabled = data.get('notifications_enabled') === 'on';
		const email = (data.get('notification_email') as string)?.trim();
		const days = data.getAll('notification_days').map(Number).filter(Boolean);
		const notifyTime = (data.get('notification_time') as string) || '08:00';
		const timezone = (data.get('notification_timezone') as string) || 'America/Chicago';

		if (notifEnabled && email && days.length > 0) {
			await db.insert(notificationSettings)
				.values({ subscriptionId: params.id, recipientEmail: email, daysBeforeList: days, notifyTime, timezone, enabled: true })
				.onConflictDoUpdate({ target: notificationSettings.subscriptionId, set: { recipientEmail: email, daysBeforeList: days, notifyTime, timezone, enabled: true, updatedAt: new Date() } });
		} else if (!notifEnabled) {
			await db.insert(notificationSettings)
				.values({ subscriptionId: params.id, recipientEmail: email || '', daysBeforeList: days.length > 0 ? days : [7], notifyTime, timezone, enabled: false })
				.onConflictDoUpdate({ target: notificationSettings.subscriptionId, set: { enabled: false, updatedAt: new Date() } });
		}

		const tagNames = data.getAll('tag_names') as string[];
		await syncTags(params.id, tagNames);

		redirect(302, `/subscriptions/${params.id}`);
	}
};
