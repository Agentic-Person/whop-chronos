import { Whop } from "@whop/sdk";

/**
 * Whop SDK Client
 *
 * Uses environment variables automatically:
 * - WHOP_API_KEY: API key for server-side operations
 * - WHOP_APP_ID: App ID for JWT verification (verifyUserToken)
 * - WHOP_WEBHOOK_SECRET: Secret for webhook signature verification
 *
 * @see https://docs.whop.com/developer/guides/authentication
 */
export const whopsdk = new Whop();
// SDK auto-reads from WHOP_API_KEY, WHOP_APP_ID, and WHOP_WEBHOOK_SECRET env vars
