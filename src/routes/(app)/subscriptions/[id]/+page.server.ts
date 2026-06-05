import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requireUser } from '$lib/server/auth-guard';
import {
	subscriptions,
	subscriptionCredentials,
	notificationSettings,
	notificationLogs,
	notificationEvents,
	subscriptionTags
} from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { decrypt } from '$lib/server/crypto';
import { sendTestNotificationEmail } from '$lib/server/resend';
import { getNextNotificationPreview } from '$lib/server/notification-schedule';

function advanceDueDate(dueDate: string, billingCycle: string): string {
	const d = new Date(dueDate + 'T00:00:00');
	switch (billingCycle) {
		case 'weekly': d.setDate(d.getDate() + 7); break;
		case 'biweekly': d.setDate(d.getDate() + 14); break;
		case 'monthly': d.setMonth(d.getMonth() + 1); break;
		case 'quarterly': d.setMonth(d.getMonth() + 3); break;
		case 'biannual': d.setMonth(d.getMonth() + 6); break;
		case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
	}
	return d.toISOString().split('T')[0];
}

export async function load({ params, locals }) {
	const user = requireUser(locals);

	const [row] = await db
		.select({
			subscription: subscriptions,
			credentials: subscriptionCredentials,
			notifications: notificationSettings
		})
		.from(subscriptions)
		.leftJoin(subscriptionCredentials, eq(subscriptions.id, subscriptionCredentials.subscriptionId))
		.leftJoin(notificationSettings, eq(subscriptions.id, notificationSettings.subscriptionId))
		.where(and(eq(subscriptions.id, params.id), eq(subscriptions.userId, user.id)));

	if (!row) throw error(404, 'Subscription not found');

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const due = new Date(row.subscription.dueDate + 'T00:00:00');
	due.setHours(0, 0, 0, 0);
	const daysUntil = Math.round((due.getTime() - today.getTime()) / 86_400_000);

	let password: string | null = null;
	if (row.credentials?.encryptedPassword) {
		try {
			password = decrypt(row.credentials.encryptedPassword);
		} catch {
			password = null;
		}
	}

	const subTags = await db.query.subscriptionTags.findMany({
		where: eq(subscriptionTags.subscriptionId, params.id),
		with: { tag: true }
	});

	const notificationHistory = await db
		.select()
		.from(notificationEvents)
		.where(eq(notificationEvents.subscriptionId, params.id))
		.orderBy(desc(notificationEvents.createdAt))
		.limit(8);

	return {
		subscription: row.subscription,
		credentials: row.credentials ? { ...row.credentials, password } : null,
		notifications: row.notifications,
		nextNotification: getNextNotificationPreview(row.subscription, row.notifications),
		notificationHistory,
		tags: subTags.map((st) => st.tag),
		daysUntil
	};
}

export const actions = {
	markPaid: async ({ params, locals }) => {
		const user = requireUser(locals);

		const [sub] = await db
			.select({ dueDate: subscriptions.dueDate, billingCycle: subscriptions.billingCycle })
			.from(subscriptions)
			.where(and(eq(subscriptions.id, params.id), eq(subscriptions.userId, user.id)));

		if (!sub) return fail(404, { error: 'Not found' });

		const oldDueDate = sub.dueDate;
		const newDueDate = advanceDueDate(sub.dueDate, sub.billingCycle);

		await db
			.update(subscriptions)
			.set({ dueDate: newDueDate, updatedAt: new Date() })
			.where(and(eq(subscriptions.id, params.id), eq(subscriptions.userId, user.id)));

		// Clear old notification logs so fresh reminders fire for the new cycle
		await db
			.delete(notificationLogs)
			.where(
				and(
					eq(notificationLogs.subscriptionId, params.id),
					eq(notificationLogs.dueDate, oldDueDate)
				)
			);
	},

	toggleActive: async ({ params, locals }) => {
		const user = requireUser(locals);

		const [sub] = await db
			.select({ isActive: subscriptions.isActive })
			.from(subscriptions)
			.where(and(eq(subscriptions.id, params.id), eq(subscriptions.userId, user.id)));

		if (!sub) return fail(404, { error: 'Not found' });

		await db
			.update(subscriptions)
			.set({ isActive: !sub.isActive, updatedAt: new Date() })
			.where(and(eq(subscriptions.id, params.id), eq(subscriptions.userId, user.id)));
	},

	sendTestNotification: async ({ params, locals }) => {
		const user = requireUser(locals);

		const [row] = await db
			.select({ subscription: subscriptions, notifications: notificationSettings })
			.from(subscriptions)
			.leftJoin(notificationSettings, eq(subscriptions.id, notificationSettings.subscriptionId))
			.where(and(eq(subscriptions.id, params.id), eq(subscriptions.userId, user.id)));

		if (!row?.subscription) return fail(404, { error: 'Not found' });
		if (!row.notifications?.recipientEmail) {
			return fail(400, { error: 'Notification email is not configured' });
		}

		try {
			await sendTestNotificationEmail({
				to: row.notifications.recipientEmail,
				subscription: row.subscription
			});
			await db.insert(notificationEvents).values({
				subscriptionId: params.id,
				eventType: 'test',
				status: 'sent',
				recipientEmail: row.notifications.recipientEmail,
				message: 'Test email sent'
			});
			return { testSent: true };
		} catch (err) {
			await db.insert(notificationEvents).values({
				subscriptionId: params.id,
				eventType: 'test',
				status: 'failed',
				recipientEmail: row.notifications.recipientEmail,
				message: String(err)
			});
			return fail(500, { error: 'Test email failed' });
		}
	},

	delete: async ({ params, locals }) => {
		const user = requireUser(locals);

		await db
			.delete(subscriptions)
			.where(and(eq(subscriptions.id, params.id), eq(subscriptions.userId, user.id)));
		redirect(302, '/dashboard');
	}
};
