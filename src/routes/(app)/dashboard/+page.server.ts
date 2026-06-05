import { db } from '$lib/server/db';
import { subscriptions } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/auth-guard';
import { asc, eq } from 'drizzle-orm';

const MONTHLY_FACTOR: Record<string, number> = {
	weekly: 52 / 12,
	biweekly: 26 / 12,
	monthly: 1,
	quarterly: 1 / 3,
	biannual: 1 / 6,
	yearly: 1 / 12
};

export async function load({ locals }) {
	const user = requireUser(locals);

	const rows = await db.query.subscriptions.findMany({
		where: eq(subscriptions.userId, user.id),
		with: {
			credentials: { columns: { username: true, encryptedPassword: true } },
			notificationSettings: { columns: { enabled: true } },
			subscriptionTags: { with: { tag: true } }
		},
		orderBy: [asc(subscriptions.dueDate)]
	});

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let totalMonthly = 0;
	const cycleTotals: Record<string, number> = {};

	const items = rows.map((row) => {
		const due = new Date(row.dueDate + 'T00:00:00');
		due.setHours(0, 0, 0, 0);
		const daysUntil = Math.round((due.getTime() - today.getTime()) / 86_400_000);

		const amount = row.amount ? parseFloat(row.amount) : 0;
		if (row.isActive && amount > 0) {
			totalMonthly += amount * (MONTHLY_FACTOR[row.billingCycle] ?? 0);
			cycleTotals[row.billingCycle] = (cycleTotals[row.billingCycle] ?? 0) + amount;
		}

		return {
			id: row.id,
			name: row.name,
			description: row.description,
			amount: row.amount,
			currency: row.currency,
			billingCycle: row.billingCycle,
			dueDate: row.dueDate,
			websiteUrl: row.websiteUrl,
			category: row.category,
			isActive: row.isActive,
			daysUntil,
			tags: row.subscriptionTags.map((st) => st.tag),
			hasCredentials: !!(row.credentials?.username || row.credentials?.encryptedPassword),
			notificationsEnabled: row.notificationSettings?.enabled ?? false
		};
	});

	return {
		items,
		cycleTotals,
		stats: {
			totalMonthly,
			totalActive: items.filter((i) => i.isActive).length,
			dueSoon: items.filter((i) => i.isActive && i.daysUntil >= 0 && i.daysUntil <= 7).length,
			overdue: items.filter((i) => i.isActive && i.daysUntil < 0).length
		}
	};
}
