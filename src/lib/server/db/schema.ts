import {
	pgTable,
	uuid,
	text,
	numeric,
	varchar,
	boolean,
	timestamp,
	date,
	integer,
	unique,
	primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth.schema';

export const subscriptions = pgTable('subscriptions', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	amount: numeric('amount', { precision: 10, scale: 2 }),
	currency: varchar('currency', { length: 3 }).notNull().default('USD'),
	billingCycle: varchar('billing_cycle', { length: 20 }).notNull().default('monthly'),
	dueDate: date('due_date').notNull(),
	websiteUrl: text('website_url'),
	category: varchar('category', { length: 50 }).default('other'),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const subscriptionCredentials = pgTable('subscription_credentials', {
	id: uuid('id').defaultRandom().primaryKey(),
	subscriptionId: uuid('subscription_id')
		.references(() => subscriptions.id, { onDelete: 'cascade' })
		.notNull()
		.unique(),
	username: text('username'),
	encryptedPassword: text('encrypted_password'),
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const notificationSettings = pgTable('notification_settings', {
	id: uuid('id').defaultRandom().primaryKey(),
	subscriptionId: uuid('subscription_id')
		.references(() => subscriptions.id, { onDelete: 'cascade' })
		.notNull()
		.unique(),
	daysBeforeList: integer('days_before_list').array().notNull().default([7, 3, 1]),
	recipientEmail: text('recipient_email').notNull(),
	notifyTime: varchar('notify_time', { length: 5 }).notNull().default('08:00'),
	timezone: text('timezone').notNull().default('America/Chicago'),
	enabled: boolean('enabled').notNull().default(true),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const notificationLogs = pgTable(
	'notification_logs',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		subscriptionId: uuid('subscription_id')
			.references(() => subscriptions.id, { onDelete: 'cascade' })
			.notNull(),
		daysBefore: integer('days_before').notNull(),
		dueDate: date('due_date').notNull(),
		sentAt: timestamp('sent_at').defaultNow().notNull()
	},
	(t) => [unique('uniq_notification').on(t.subscriptionId, t.daysBefore, t.dueDate)]
);

export const notificationEvents = pgTable('notification_events', {
	id: uuid('id').defaultRandom().primaryKey(),
	subscriptionId: uuid('subscription_id')
		.references(() => subscriptions.id, { onDelete: 'cascade' })
		.notNull(),
	eventType: varchar('event_type', { length: 20 }).notNull().default('scheduled'),
	status: varchar('status', { length: 20 }).notNull(),
	daysBefore: integer('days_before'),
	dueDate: date('due_date'),
	recipientEmail: text('recipient_email').notNull(),
	message: text('message'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const tags = pgTable('tags', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	color: varchar('color', { length: 20 }).notNull().default('blue'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const subscriptionTags = pgTable(
	'subscription_tags',
	{
		subscriptionId: uuid('subscription_id')
			.references(() => subscriptions.id, { onDelete: 'cascade' })
			.notNull(),
		tagId: uuid('tag_id')
			.references(() => tags.id, { onDelete: 'cascade' })
			.notNull()
	},
	(t) => [primaryKey({ columns: [t.subscriptionId, t.tagId] })]
);

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
	credentials: one(subscriptionCredentials, {
		fields: [subscriptions.id],
		references: [subscriptionCredentials.subscriptionId]
	}),
	notificationSettings: one(notificationSettings, {
		fields: [subscriptions.id],
		references: [notificationSettings.subscriptionId]
	}),
	subscriptionTags: many(subscriptionTags)
}));

export const tagsRelations = relations(tags, ({ many }) => ({
	subscriptionTags: many(subscriptionTags)
}));

export const subscriptionTagsRelations = relations(subscriptionTags, ({ one }) => ({
	subscription: one(subscriptions, {
		fields: [subscriptionTags.subscriptionId],
		references: [subscriptions.id]
	}),
	tag: one(tags, {
		fields: [subscriptionTags.tagId],
		references: [tags.id]
	})
}));

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type SubscriptionCredential = typeof subscriptionCredentials.$inferSelect;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type NotificationEvent = typeof notificationEvents.$inferSelect;
export type Tag = typeof tags.$inferSelect;

export * from './auth.schema';
