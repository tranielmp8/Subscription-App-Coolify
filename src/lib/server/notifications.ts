import { db } from './db';
import { subscriptions, notificationSettings, notificationLogs, notificationEvents } from './db/schema';
import { and, eq } from 'drizzle-orm';
import { sendNotificationEmail } from './resend';
import { getLocalDaysUntil, shouldSendNotificationNow } from './notification-schedule';

export async function runNotifications(): Promise<{ sent: number; errors: string[] }> {
	const active = await db
		.select({ subscription: subscriptions, settings: notificationSettings })
		.from(subscriptions)
		.innerJoin(notificationSettings, eq(subscriptions.id, notificationSettings.subscriptionId))
		.where(and(eq(subscriptions.isActive, true), eq(notificationSettings.enabled, true)));

	let sent = 0;
	const errors: string[] = [];

	for (const { subscription, settings } of active) {
		if (!shouldSendNotificationNow(settings)) continue;

		const daysUntil = getLocalDaysUntil(subscription, settings);

		for (const daysBefore of settings.daysBeforeList) {
			if (daysUntil !== daysBefore) continue;

			const [existing] = await db
				.select({ id: notificationLogs.id })
				.from(notificationLogs)
				.where(
					and(
						eq(notificationLogs.subscriptionId, subscription.id),
						eq(notificationLogs.daysBefore, daysBefore),
						eq(notificationLogs.dueDate, subscription.dueDate)
					)
				)
				.limit(1);

			if (existing) continue;

			try {
				await sendNotificationEmail({ to: settings.recipientEmail, subscription, daysBefore });
				await db.insert(notificationLogs).values({
					subscriptionId: subscription.id,
					daysBefore,
					dueDate: subscription.dueDate
				});
				await db.insert(notificationEvents).values({
					subscriptionId: subscription.id,
					eventType: 'scheduled',
					status: 'sent',
					daysBefore,
					dueDate: subscription.dueDate,
					recipientEmail: settings.recipientEmail,
					message: `Sent ${daysBefore} day reminder`
				});
				sent++;
			} catch (err) {
				const message = String(err);
				errors.push(`${subscription.name} (${daysBefore}d): ${message}`);
				await db.insert(notificationEvents).values({
					subscriptionId: subscription.id,
					eventType: 'scheduled',
					status: 'failed',
					daysBefore,
					dueDate: subscription.dueDate,
					recipientEmail: settings.recipientEmail,
					message
				});
			}
		}
	}

	return { sent, errors };
}
