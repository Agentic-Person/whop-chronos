# Scripts

This directory contains utility scripts for the Chronos project.

## Available Scripts

### `verify-setup.ts`

Validates that all required project configurations are in place.

**Usage:**
```bash
npm run verify-setup
```

**Checks:**
- TypeScript configuration (strict mode enabled)
- Package.json scripts and dependencies
- Environment variables documentation
- Next.js production optimizations
- Git ignore configuration

**Exit Codes:**
- `0` - All checks passed (may have warnings)
- `1` - One or more checks failed

### Running Scripts

All scripts use `tsx` for TypeScript execution. To run any script directly:

```bash
npx tsx scripts/script-name.ts
```

## Adding New Scripts

1. Create a new `.ts` file in this directory
2. Add a shebang line: `#!/usr/bin/env tsx`
3. Add the script command to `package.json` scripts section
4. Document it in this README
