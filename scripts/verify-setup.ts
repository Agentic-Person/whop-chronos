#!/usr/bin/env tsx
/**
 * Setup Verification Script for Chronos
 * Validates that all required configurations are in place
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

interface CheckResult {
	name: string;
	status: "pass" | "fail" | "warning";
	message: string;
}

const results: CheckResult[] = [];

function check(
	name: string,
	status: "pass" | "fail" | "warning",
	message: string,
) {
	results.push({ name, status, message });
}

// Check 1: TypeScript Configuration
try {
	const tsconfig = JSON.parse(
		readFileSync(join(process.cwd(), "tsconfig.json"), "utf-8"),
	);
	const requiredStrictChecks = [
		"strict",
		"noImplicitAny",
		"strictNullChecks",
		"noUnusedLocals",
		"noUnusedParameters",
		"noImplicitReturns",
		"noFallthroughCasesInSwitch",
		"noUncheckedIndexedAccess",
	];

	const missingChecks = requiredStrictChecks.filter(
		(check) => !tsconfig.compilerOptions[check],
	);

	if (missingChecks.length === 0) {
		check(
			"TypeScript Configuration",
			"pass",
			"All strict type checks enabled",
		);
	} else {
		check(
			"TypeScript Configuration",
			"warning",
			`Missing strict checks: ${missingChecks.join(", ")}`,
		);
	}
} catch (error) {
	check("TypeScript Configuration", "fail", "tsconfig.json not found or invalid");
}

// Check 2: Package.json Configuration
try {
	const pkg = JSON.parse(
		readFileSync(join(process.cwd(), "package.json"), "utf-8"),
	);

	const requiredScripts = ["dev", "build", "start", "lint", "type-check"];
	const missingScripts = requiredScripts.filter(
		(script) => !pkg.scripts?.[script],
	);

	if (missingScripts.length === 0) {
		check("Package Scripts", "pass", "All required scripts present");
	} else {
		check(
			"Package Scripts",
			"warning",
			`Missing scripts: ${missingScripts.join(", ")}`,
		);
	}

	const requiredDeps = [
		"@whop/sdk",
		"@whop/react",
		"@supabase/supabase-js",
		"@anthropic-ai/sdk",
		"openai",
		"inngest",
		"@vercel/kv",
		"@upstash/ratelimit",
		"frosted-ui",
		"recharts",
	];

	const missingDeps = requiredDeps.filter((dep) => !pkg.dependencies?.[dep]);

	if (missingDeps.length === 0) {
		check("Dependencies", "pass", "All core dependencies installed");
	} else {
		check(
			"Dependencies",
			"fail",
			`Missing dependencies: ${missingDeps.join(", ")}`,
		);
	}
} catch (error) {
	check("Package Configuration", "fail", "package.json not found or invalid");
}

// Check 3: Environment Variables
try {
	const envExample = readFileSync(
		join(process.cwd(), ".env.example"),
		"utf-8",
	);

	const requiredEnvVars = [
		"WHOP_API_KEY",
		"WHOP_CLIENT_ID",
		"WHOP_CLIENT_SECRET",
		"WHOP_WEBHOOK_SECRET",
		"NEXT_PUBLIC_SUPABASE_URL",
		"NEXT_PUBLIC_SUPABASE_ANON_KEY",
		"SUPABASE_SERVICE_ROLE_KEY",
		"ANTHROPIC_API_KEY",
		"OPENAI_API_KEY",
		"VERCEL_KV_URL",
		"UPSTASH_REDIS_REST_URL",
		"UPSTASH_REDIS_REST_TOKEN",
		"SENTRY_DSN",
		"NEXT_PUBLIC_SENTRY_DSN",
	];

	const missingEnvVars = requiredEnvVars.filter(
		(envVar) => !envExample.includes(envVar),
	);

	if (missingEnvVars.length === 0) {
		check(
			"Environment Variables",
			"pass",
			"All required env vars documented in .env.example",
		);
	} else {
		check(
			"Environment Variables",
			"warning",
			`Missing env vars in .env.example: ${missingEnvVars.join(", ")}`,
		);
	}
} catch (error) {
	check(
		"Environment Variables",
		"fail",
		".env.example not found or not readable",
	);
}

// Check 4: Next.js Configuration
try {
	const nextConfigContent = readFileSync(
		join(process.cwd(), "next.config.ts"),
		"utf-8",
	);

	const requiredConfigs = [
		"reactStrictMode",
		"images",
		"headers",
		"experimental",
	];

	const missingConfigs = requiredConfigs.filter(
		(config) => !nextConfigContent.includes(config),
	);

	if (missingConfigs.length === 0) {
		check(
			"Next.js Configuration",
			"pass",
			"Production optimizations configured",
		);
	} else {
		check(
			"Next.js Configuration",
			"warning",
			`Missing configs: ${missingConfigs.join(", ")}`,
		);
	}
} catch (error) {
	check(
		"Next.js Configuration",
		"fail",
		"next.config.ts not found or invalid",
	);
}

// Check 5: Git Configuration
try {
	const gitignore = readFileSync(join(process.cwd(), ".gitignore"), "utf-8");

	const requiredIgnores = [
		".env",
		".env.local",
		"node_modules",
		".next",
		".vercel",
	];

	const missingIgnores = requiredIgnores.filter(
		(ignore) => !gitignore.includes(ignore),
	);

	if (missingIgnores.length === 0) {
		check("Git Configuration", "pass", "All sensitive files ignored");
	} else {
		check(
			"Git Configuration",
			"warning",
			`Missing ignores: ${missingIgnores.join(", ")}`,
		);
	}
} catch (error) {
	check("Git Configuration", "fail", ".gitignore not found or not readable");
}

// Print Results
console.log("\n=================================");
console.log("Chronos Setup Verification");
console.log("=================================\n");

let passCount = 0;
let failCount = 0;
let warningCount = 0;

for (const result of results) {
	const symbol =
		result.status === "pass" ? "✓" : result.status === "fail" ? "✗" : "⚠";
	const color =
		result.status === "pass"
			? "\x1b[32m"
			: result.status === "fail"
				? "\x1b[31m"
				: "\x1b[33m";
	const reset = "\x1b[0m";

	console.log(`${color}${symbol}${reset} ${result.name}`);
	console.log(`  ${result.message}\n`);

	if (result.status === "pass") passCount++;
	else if (result.status === "fail") failCount++;
	else warningCount++;
}

console.log("=================================");
console.log(
	`Results: ${passCount} passed, ${warningCount} warnings, ${failCount} failed`,
);
console.log("=================================\n");

if (failCount > 0) {
	console.error("❌ Setup verification failed. Please fix the issues above.");
	process.exit(1);
}

if (warningCount > 0) {
	console.warn("⚠️  Setup verification passed with warnings.");
	process.exit(0);
}

console.log("✅ Setup verification passed!");
process.exit(0);
