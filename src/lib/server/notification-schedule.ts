import type { NotificationSetting, Subscription } from './db/schema';

const MS_PER_DAY = 86_400_000;

function localParts(date: Date, timezone: string) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		hourCycle: 'h23'
	}).formatToParts(date);

	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	return {
		date: `${values.year}-${values.month}-${values.day}`,
		time: `${values.hour}:${values.minute}`
	};
}

function addDays(dateString: string, days: number) {
	const date = new Date(`${dateString}T00:00:00`);
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}

function daysBetween(startDate: string, endDate: string) {
	const start = new Date(`${startDate}T00:00:00`);
	const end = new Date(`${endDate}T00:00:00`);
	return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

export function shouldSendNotificationNow(settings: NotificationSetting, now = new Date()) {
	const local = localParts(now, settings.timezone);
	return local.time === settings.notifyTime;
}

export function getLocalDaysUntil(subscription: Subscription, settings: NotificationSetting, now = new Date()) {
	const local = localParts(now, settings.timezone);
	return daysBetween(local.date, subscription.dueDate);
}

export function getNextNotificationPreview(
	subscription: Subscription,
	settings: NotificationSetting | null,
	now = new Date()
) {
	if (!settings?.enabled) return null;

	const local = localParts(now, settings.timezone);
	const sortedDays = [...settings.daysBeforeList].sort((a, b) => b - a);

	for (const daysBefore of sortedDays) {
		const reminderDate = addDays(subscription.dueDate, -daysBefore);
		const reminderHasPassed =
			reminderDate < local.date || (reminderDate === local.date && settings.notifyTime <= local.time);

		if (!reminderHasPassed) {
			return {
				daysBefore,
				date: reminderDate,
				time: settings.notifyTime,
				timezone: settings.timezone
			};
		}
	}

	return null;
}

export function formatNotificationTime(time: string) {
	const [hourRaw, minute] = time.split(':');
	const hour = Number(hourRaw);
	const suffix = hour >= 12 ? 'PM' : 'AM';
	const displayHour = hour % 12 || 12;
	return `${displayHour}:${minute} ${suffix}`;
}
