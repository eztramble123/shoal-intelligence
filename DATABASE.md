# Database Documentation

## Overview
This application uses PostgreSQL hosted on Neon with Prisma as the ORM. The database supports both OAuth (Google) and email/password authentication, along with subscription management and data tracking features.

## Database Provider
- **Provider**: PostgreSQL
- **Host**: Neon (neon.tech)
- **ORM**: Prisma
- **Connection**: Pooled connection via Neon

## Core Tables

### Authentication & Users

#### `users`
Central user table containing authentication and profile information.

**Fields:**
- `id` - Unique identifier (cuid)
- `email` - User email (unique)
- `password` - Hashed password for email auth (nullable for OAuth users)
- `emailVerified` - Email verification timestamp
- `name` - User display name
- `image` - Profile image URL

**Stripe Integration:**
- `stripeCustomerId` - Stripe customer ID
- `stripeSubscriptionId` - Active subscription ID
- `stripePriceId` - Current price/plan ID
- `stripeCurrentPeriodEnd` - Subscription period end

**Plan Management:**
- `planType` - Current plan (pending/free/pro)
- `planSelectedAt` - When plan was selected

**Legacy Fields (for backward compatibility):**
- `companyName`, `companySize`, `useCase`
- `hasUsedTrial`, `isWhitelisted`
- `trialStartDate`, `trialEndDate`

#### `accounts`
OAuth provider accounts linked to users (NextAuth requirement).

#### `sessions`
Active user sessions (NextAuth requirement).

#### `verificationtokens`
Email verification tokens for new registrations.

#### `password_reset_tokens`
Tokens for password reset functionality.
- Links to user via `userId`
- Has expiration and usage tracking
- Automatically deleted on cascade with user

### Subscription Management

#### `subscriptions`
Stripe subscription details.
- Links to user
- Tracks subscription status and billing periods
- Synced with Stripe webhooks

### Data Tracking

#### `funding_snapshots`
Daily snapshots of funding data by sector.
- Indexed by date and sector for efficient queries
- Tracks total amount, deal count, and percentages

#### `funding_trends`
Aggregated funding trends over time periods.
- Unique by sector
- Tracks period-over-period changes

#### `listing_snapshots`
Daily snapshots of token/asset listings across exchanges.
- Indexed by date and ticker
- Tracks exchanges, price, market cap, volume

#### `listing_trends`
Aggregated listing trends showing exchange adoption.
- Unique by ticker
- Tracks exchange count changes over time

### Legacy Tables

#### `enterprise_inquiries`
Contact form submissions for enterprise sales.

#### `whitelist_applications`
Early access/whitelist applications (deprecated but preserved).

## Database Migrations

### Current Strategy
Since the database is already in production without migration history:
1. Use `prisma db push` for schema updates
2. Always backup before major changes
3. Test changes in development first

### Future Migration Setup
To establish proper migration tracking:
```bash
# Initialize migrations from current state
npx prisma migrate dev --name init --create-only
npx prisma migrate resolve --applied init

# Future changes
npx prisma migrate dev --name your_change_name
```

### Safe Schema Changes
1. **Adding fields**: Always make new fields nullable or provide defaults
2. **Removing fields**: First deploy code that doesn't use the field, then remove from schema
3. **Renaming**: Use `@map` to maintain database column names while changing model fields

## Environment Variables

Required in `.env` or `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (optional if using credentials)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Service (for password reset & verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PRO="price_..."
```

## Backup & Recovery

### Manual Backup
```bash
# Export database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Import database
psql $DATABASE_URL < backup.sql
```

### Neon Features
- Automatic backups with point-in-time recovery
- Branching for testing migrations
- Connection pooling for scalability

## Best Practices

1. **Never store sensitive data unencrypted**
   - Passwords are hashed with bcrypt
   - API keys should use encryption at rest

2. **Use transactions for critical operations**
   ```typescript
   await prisma.$transaction([
     // Multiple operations
   ])
   ```

3. **Index frequently queried fields**
   - Already implemented for date/ticker/sector queries
   - Monitor slow queries and add indexes as needed

4. **Clean up expired tokens**
   - Implement cron job to delete expired verification and reset tokens
   - Consider TTL indexes for automatic cleanup

5. **Monitor database performance**
   - Use Neon's analytics dashboard
   - Track slow queries
   - Monitor connection pool usage

## Troubleshooting

### Common Issues

1. **"Drift detected" error**
   - Database schema doesn't match Prisma schema
   - Solution: `npx prisma db pull` to sync or `npx prisma db push --accept-data-loss` (careful!)

2. **Connection timeouts**
   - Check connection pooling settings
   - Verify SSL requirements
   - Check Neon service status

3. **Migration failures**
   - Always test in development first
   - Use `--create-only` flag to review SQL before applying
   - Have rollback plan ready

### Useful Commands

```bash
# Sync Prisma schema with database
npx prisma db push

# Pull database schema to Prisma
npx prisma db pull

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Security Considerations

1. **Connection Security**
   - Always use SSL for database connections
   - Rotate database passwords regularly
   - Use connection pooling to prevent connection exhaustion

2. **Data Protection**
   - Hash passwords with bcrypt (minimum 10 rounds)
   - Implement rate limiting on auth endpoints
   - Use CSRF protection (handled by NextAuth)
   - Validate and sanitize all inputs

3. **Access Control**
   - Use row-level security where applicable
   - Implement proper session management
   - Regular security audits

## Maintenance Schedule

- **Daily**: Monitor error logs and performance metrics
- **Weekly**: Review slow query logs
- **Monthly**: Clean up expired tokens and sessions
- **Quarterly**: Review and optimize indexes
- **Yearly**: Security audit and dependency updates