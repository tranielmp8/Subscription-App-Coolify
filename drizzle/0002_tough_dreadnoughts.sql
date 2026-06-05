CREATE TABLE "notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"event_type" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"status" varchar(20) NOT NULL,
	"days_before" integer,
	"due_date" date,
	"recipient_email" text NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "notify_time" varchar(5) DEFAULT '08:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "timezone" text DEFAULT 'America/Chicago' NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;