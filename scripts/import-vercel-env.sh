#!/bin/bash

# Import Vercel Environment Variables from .env.update
# This script reads .env.update and imports all variables to Vercel

echo "📥 Importing environment variables from .env.update to Vercel..."
echo ""

ENV_FILE=".env.update"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: $ENV_FILE not found!"
  exit 1
fi

# Read .env.update and process each line
TOTAL_VARS=0
IMPORTED=0

while IFS= read -r line || [ -n "$line" ]; do
  # Skip comments and empty lines
  if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
    continue
  fi

  # Extract variable name and value
  if [[ "$line" =~ ^([A-Z_][A-Z0-9_]*)=(.*)$ ]]; then
    VAR_NAME="${BASH_REMATCH[1]}"
    VAR_VALUE="${BASH_REMATCH[2]}"

    TOTAL_VARS=$((TOTAL_VARS + 1))

    echo "[$TOTAL_VARS] Importing $VAR_NAME..."

    # Add to production
    echo "$VAR_VALUE" | vercel env add "$VAR_NAME" production 2>&1 | grep -E "(Added|Error)" || true

    # Add to preview
    echo "$VAR_VALUE" | vercel env add "$VAR_NAME" preview 2>&1 | grep -E "(Added|Error)" || true

    # Add to development
    echo "$VAR_VALUE" | vercel env add "$VAR_NAME" development 2>&1 | grep -E "(Added|Error)" || true

    IMPORTED=$((IMPORTED + 1))
  fi
done < "$ENV_FILE"

echo ""
echo "✅ Import complete!"
echo "   Total variables imported: $IMPORTED"
echo "   Environments: production, preview, development"
echo ""
echo "Next step: Verify import and redeploy"
