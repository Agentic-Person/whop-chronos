import { Whop } from "@whop/sdk";

export const whopsdk = new Whop({
	appID: process.env['NEXT_PUBLIC_WHOP_APP_ID'],
	apiKey: process.env['WHOP_API_KEY'],
	// Note: webhookKey is read automatically from WHOP_WEBHOOK_SECRET env var
});
