import { db } from '@/src/lib/database'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg'
    }),
    socialProviders: {
        discord: {
            clientId: process.env.AUTH_DISCORD_ID!,
            clientSecret: process.env.AUTH_DISCORD_SECRET!,
        }
    },
    plugins: [
        organization()
    ]
})