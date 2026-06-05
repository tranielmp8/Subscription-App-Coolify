# Deployment

## Coolify + VPS

This is the current primary deployment target. The Railway config files are still
kept in the repo so the app can be moved back later if needed.

### Coolify compose resource

Use one Coolify Docker Compose resource for the app, plus an external PostgreSQL
database resource.

In Coolify, create a Docker Compose resource from this repository and select:

```text
docker-compose.coolify.yml
```

Set the public domain on the `app` service port `3000`.

Required Coolify environment variables:

```env
DATABASE_URL=postgres://USER:PASSWORD@POSTGRES_INTERNAL_HOST:5432/DB_NAME
ORIGIN=https://subscriptions.your-domain.com
CSRF_TRUSTED_ORIGINS=https://subscriptions.your-domain.com
BETTER_AUTH_TRUSTED_ORIGINS=https://subscriptions.your-domain.com
BETTER_AUTH_SECRET=replace_with_a_32_plus_character_random_secret
LEGACY_OWNER_EMAIL=
ENCRYPTION_KEY=replace_with_64_hex_characters_from_node_crypto
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL="Pride N Purpose <notifications@your-domain.com>"
CRON_SECRET=replace_with_a_strong_shared_cron_secret
NOTIFICATION_CRON_URL=https://subscriptions.your-domain.com
```

`.env.coolify.example` contains the same values as a copy/paste template.

Do not mark `NODE_ENV=production` as build-time in Coolify. The compose file
sets it at runtime for the app service.

### First deploy

Run migrations after the first deploy and whenever new migrations are added:

```sh
npm run db:migrate
```

The Docker image includes the migration files and database schema, so this can be
run as a one-off command in the deployed container as long as `DATABASE_URL` is
set.

### Notification cron

Create a scheduled task in Coolify for the app service:

- Schedule: `*/30 * * * *`
- Command: `npm run cron:notifications`

`CRON_SECRET` must match the web app's value. `NOTIFICATION_CRON_URL` should be
the public app URL.

The cron wakes up every 30 minutes, calls the web app, and the app only sends
reminders whose saved local time and timezone match that moment.

## Railway services

Railway is no longer the primary target, but these files are kept as a fallback:

Create two Railway services from this repository:

1. Web app service
   - Config file: `railway.toml`
   - Starts the SvelteKit app with `npm run start`

2. Notification cron service
   - Config file: `/railway.cron.toml`
   - Runs `npm run cron:notifications`
   - Schedule: `*/30 * * * *`

Railway uses `railway.toml` automatically for a service by default. For the cron service, set the custom config file path in that service's settings to `/railway.cron.toml`.

Railway cron schedules are evaluated in UTC. The cron service wakes up every 30 minutes, calls the web app, and the app only sends reminders whose saved local time and timezone match that moment.

## Required variables

Set these on the Railway web app service:

```env
DATABASE_URL=
ORIGIN=
CSRF_TRUSTED_ORIGINS=
BETTER_AUTH_TRUSTED_ORIGINS=
BETTER_AUTH_SECRET=
LEGACY_OWNER_EMAIL=
ENCRYPTION_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CRON_SECRET=
```

Set these on the notification cron service:

```env
CRON_SECRET=
NOTIFICATION_CRON_URL=
```

`CRON_SECRET` must be the same value on both services. `NOTIFICATION_CRON_URL` should be the public URL of the web app service, for example `https://your-app.up.railway.app`.

`LEGACY_OWNER_EMAIL` is only needed if you already have subscription rows from before user accounts existed. Set it to your login email before your first login after deploying auth, then remove it after the rows are claimed.

## Database

Run migrations before using notification times/history in production:

```sh
npm run db:migrate
```
