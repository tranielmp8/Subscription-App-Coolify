import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { subscriptions, subscriptionCredentials, notificationSettings, tags, subscriptionTags } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth-guard';
import { encrypt } from '$lib/server/crypto';
import { getTagColor } from '$lib/utils/tags';
import { asc, eq } from 'drizzle-orm';

async function syncTags(subscriptionId: string, tagNames: string[]) {
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

export async function load({ locals }) {
	const user = requireUser(locals);

	const allTags = await db
		.selectDistinct({ id: tags.id, name: tags.name, color: tags.color, createdAt: tags.createdAt })
		.from(tags)
		.innerJoin(subscriptionTags, eq(tags.id, subscriptionTags.tagId))
		.innerJoin(subscriptions, eq(subscriptionTags.subscriptionId, subscriptions.id))
		.where(eq(subscriptions.userId, user.id))
		.orderBy(asc(tags.name));

	return { allTags };
}

export const actions = {
	default: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();

		const name = (data.get('name') as string)?.trim();
		const dueDate = data.get('due_date') as string;

		if (!name) return fail(400, { error: 'Name is required' });
		if (!dueDate) return fail(400, { error: 'Due date is required' });

		const [sub] = await db
			.insert(subscriptions)
			.values({
				userId: user.id,
				name,
				description: (data.get('description') as string)?.trim() || null,
				amount: (data.get('amount') as string)?.trim() || null,
				currency: (data.get('currency') as string) || 'USD',
				billingCycle: (data.get('billing_cycle') as string) || 'monthly',
				dueDate,
				websiteUrl: (data.get('website_url') as string)?.trim() || null,
				category: (data.get('category') as string) || 'other',
				isActive: true
			})
			.returning({ id: subscriptions.id });

		const username = (data.get('username') as string)?.trim();
		const password = (data.get('password') as string)?.trim();
		const notes = (data.get('notes') as string)?.trim();

		if (username || password || notes) {
			await db.insert(subscriptionCredentials).values({
				subscriptionId: sub.id,
				username: username || null,
				encryptedPassword: password ? encrypt(password) : null,
				notes: notes || null
			});
		}

		const notifEnabled = data.get('notifications_enabled') === 'on';
		if (notifEnabled) {
			const email = (data.get('notification_email') as string)?.trim();
			const days = data.getAll('notification_days').map(Number).filter(Boolean);
			const notifyTime = (data.get('notification_time') as string) || '08:00';
			const timezone = (data.get('notification_timezone') as string) || 'America/Chicago';
			if (email && days.length > 0) {
				await db.insert(notificationSettings).values({
					subscriptionId: sub.id,
					recipientEmail: email,
					daysBeforeList: days,
					notifyTime,
					timezone,
					enabled: true
				});
			}
		}

		const tagNames = data.getAll('tag_names') as string[];
		await syncTags(sub.id, tagNames);

		redirect(302, `/subscriptions/${sub.id}`);
	}
};
