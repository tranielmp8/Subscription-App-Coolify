# Railway to Coolify Database Migration

This guide moves the Subscription App PostgreSQL data from Railway to the
Coolify/VPS PostgreSQL database.

## What This Does

The migration uses PostgreSQL's native backup tools:

- `pg_dump` exports the Railway database into `subscription-app-railway.dump`
- `pg_restore` imports that dump into the Coolify database

The dump includes tables, constraints, indexes, sequences, and data.

## Requirements

- Docker running locally
- Railway public PostgreSQL connection URL
- Coolify PostgreSQL public connection URL, temporarily enabled
- The app should already be deployed on Coolify and connected to the database

Use PostgreSQL 18 client tools through Docker so the client version is compatible
with Railway's PostgreSQL server.

## 1. Export Railway Database

From local PowerShell in the project folder:

```powershell
cd D:\Claude\PrideNPurpose\SubscriptionApp
```

Set the Railway public database URL:

```powershell
$env:RAILWAY_DATABASE_PUBLIC_URL='postgresql://USER:PASSWORD@RAILWAY_PUBLIC_HOST:PORT/DATABASE'
```

Create the dump:

```powershell
$cwd = (Get-Location).Path

docker run --rm `
  -v "${cwd}:/backup" `
  postgres:18 `
  pg_dump --dbname="$env:RAILWAY_DATABASE_PUBLIC_URL" `
  --format=custom `
  --no-owner `
  --no-acl `
  --file=/backup/subscription-app-railway.dump
```

Confirm the dump exists:

```powershell
Get-Item .\subscription-app-railway.dump
```

## 2. Temporarily Expose Coolify Postgres

In Coolify, open the PostgreSQL resource and enable public access:

- Enable `Make it publicly available`
- Use an unused public port, for example `55432`
- Do not use `5432` unless you know it is free on the VPS

Build the public Coolify database URL:

```text
postgresql://USER:PASSWORD@VPS_PUBLIC_HOST:55432/DATABASE
```

Use the same database name, user, and password from the Coolify PostgreSQL
resource.

## 3. Restore Into Coolify

Set the Coolify public database URL locally:

```powershell
$env:COOLIFY_DATABASE_PUBLIC_URL='postgresql://USER:PASSWORD@VPS_PUBLIC_HOST:55432/DATABASE'
```

Restore the Railway dump into Coolify:

```powershell
docker run --rm `
  -v "${cwd}:/backup" `
  postgres:18 `
  pg_restore --dbname="$env:COOLIFY_DATABASE_PUBLIC_URL" `
  --clean `
  --if-exists `
  --no-owner `
  --no-acl `
  --single-transaction `
  /backup/subscription-app-railway.dump
```

This may print little or nothing if it succeeds.

`--clean --if-exists` drops matching existing database objects before restoring
them from the dump. Use this only when replacing the target database contents is
intended.

## 4. Verify The Restore

List restored tables:

```powershell
docker run --rm postgres:18 `
  psql "$env:COOLIFY_DATABASE_PUBLIC_URL" `
  -c "select tablename from pg_tables where schemaname='public' order by tablename;"
```

Check subscription rows:

```powershell
docker run --rm postgres:18 `
  psql "$env:COOLIFY_DATABASE_PUBLIC_URL" `
  -c "select count(*) from subscriptions;"
```

Then log into the app:

```text
https://subscriptions.pridendevelopment.com
```

Confirm expected data appears and test the important pages/actions.

## 5. Turn Off Public Database Access

After the restore is verified:

1. In Coolify, disable public access for the PostgreSQL resource.
2. Confirm the app still uses the internal `DATABASE_URL`.
3. Confirm the app and database are connected through Coolify's predefined
   network.

The app should keep working after public database access is disabled because it
uses the internal Coolify database URL from inside the VPS Docker network.

## Troubleshooting

If `pg_dump` says the server version is newer than the client version, use the
Docker command above with `postgres:18`.

If `pg_dump` tries to connect to `localhost` as your Windows user, the Railway
URL is not loaded in PowerShell. Check:

```powershell
Write-Host $env:RAILWAY_DATABASE_PUBLIC_URL
```

If the app container cannot connect to the database and shows `CONNECT_TIMEOUT`,
enable `Connect to Predefined Network` on the Coolify Docker Compose app and
redeploy.

If local restore cannot reach Coolify, confirm:

- The Coolify database is temporarily public
- The public port is correct
- The VPS firewall allows that port
- The URL uses the VPS public host and public port, not the internal Docker host

## Security Notes

- Do not commit database URLs or passwords.
- Keep database URLs in local environment variables or `.env`, never
  `.env.example`.
- Disable public Postgres access after the migration.
- Rotate database passwords if they were pasted into logs, chat, screenshots, or
  terminals that may be shared.
