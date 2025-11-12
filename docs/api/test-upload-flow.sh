#!/bin/bash
#
# Test Video Upload Flow with cURL
#
# This script tests the complete video upload flow:
# 1. POST /api/video/upload - Get signed URL
# 2. PUT <signed-url> - Upload file
# 3. POST /api/video/[id]/confirm - Confirm and trigger processing
# 4. GET /api/video/[id]/status - Check processing status
#
# Prerequisites:
# - Valid Whop authentication token
# - Test video file (test-video.mp4)
# - Chronos API running (locally or production)

set -e  # Exit on error

# Configuration
API_BASE_URL="http://localhost:3000"  # Change for production
AUTH_TOKEN="your_whop_token_here"
CREATOR_ID="creator_123"
VIDEO_FILE="test-video.mp4"
VIDEO_TITLE="Test Upload $(date +%Y-%m-%d_%H:%M:%S)"

echo "🎬 Testing Video Upload Flow"
echo "============================="
echo ""
echo "Configuration:"
echo "  API URL: $API_BASE_URL"
echo "  Creator ID: $CREATOR_ID"
echo "  Video File: $VIDEO_FILE"
echo "  Title: $VIDEO_TITLE"
echo ""

# Check if video file exists
if [ ! -f "$VIDEO_FILE" ]; then
    echo "❌ Error: Video file not found: $VIDEO_FILE"
    exit 1
fi

# Get file info
FILE_SIZE=$(wc -c < "$VIDEO_FILE")
FILE_TYPE="video/mp4"

echo "📝 Step 1: Initiating upload..."
echo ""

# Step 1: Initiate upload
UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/video/upload" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"filename\": \"$VIDEO_FILE\",
    \"fileSize\": $FILE_SIZE,
    \"mimeType\": \"$FILE_TYPE\",
    \"title\": \"$VIDEO_TITLE\",
    \"creatorId\": \"$CREATOR_ID\"
  }")

echo "Response:"
echo "$UPLOAD_RESPONSE" | jq '.'
echo ""

# Extract video ID and upload URL
VIDEO_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.video.id')
UPLOAD_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.upload.url')

if [ "$VIDEO_ID" == "null" ] || [ "$UPLOAD_URL" == "null" ]; then
    echo "❌ Error: Failed to get video ID or upload URL"
    echo "$UPLOAD_RESPONSE"
    exit 1
fi

echo "✅ Upload initiated:"
echo "   Video ID: $VIDEO_ID"
echo "   Upload URL: ${UPLOAD_URL:0:50}..."
echo ""

# Step 2: Upload file to signed URL
echo "📤 Step 2: Uploading file to storage..."
echo ""

UPLOAD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "$UPLOAD_URL" \
  -H "Content-Type: $FILE_TYPE" \
  --data-binary "@$VIDEO_FILE")

if [ "$UPLOAD_STATUS" != "200" ] && [ "$UPLOAD_STATUS" != "201" ]; then
    echo "❌ Error: File upload failed with status $UPLOAD_STATUS"
    exit 1
fi

echo "✅ File uploaded successfully (HTTP $UPLOAD_STATUS)"
echo ""

# Step 3: Confirm upload
echo "⚡ Step 3: Confirming upload and triggering processing..."
echo ""

CONFIRM_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/video/$VIDEO_ID/confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "Response:"
echo "$CONFIRM_RESPONSE" | jq '.'
echo ""

# Check confirmation success
CONFIRM_SUCCESS=$(echo "$CONFIRM_RESPONSE" | jq -r '.success')
JOB_ID=$(echo "$CONFIRM_RESPONSE" | jq -r '.processing.jobId')
ESTIMATED_TIME=$(echo "$CONFIRM_RESPONSE" | jq -r '.processing.estimatedTime')

if [ "$CONFIRM_SUCCESS" != "true" ]; then
    echo "❌ Error: Upload confirmation failed"
    echo "$CONFIRM_RESPONSE"
    exit 1
fi

echo "✅ Upload confirmed:"
echo "   Job ID: $JOB_ID"
echo "   Estimated time: $ESTIMATED_TIME"
echo ""

# Step 4: Check processing status
echo "📊 Step 4: Checking processing status..."
echo ""

sleep 2  # Wait a bit for processing to start

STATUS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/api/video/$VIDEO_ID/status" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "Response:"
echo "$STATUS_RESPONSE" | jq '.'
echo ""

VIDEO_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
PROGRESS=$(echo "$STATUS_RESPONSE" | jq -r '.progress')

echo "✅ Status checked:"
echo "   Video Status: $VIDEO_STATUS"
echo "   Progress: $PROGRESS"
echo ""

# Summary
echo "✨ Upload Flow Completed Successfully!"
echo "====================================="
echo ""
echo "Summary:"
echo "  Video ID: $VIDEO_ID"
echo "  Status: $VIDEO_STATUS"
echo "  Job ID: $JOB_ID"
echo "  Estimated Processing Time: $ESTIMATED_TIME"
echo ""
echo "Next steps:"
echo "  1. Monitor processing: GET /api/video/$VIDEO_ID/status"
echo "  2. View video details: GET /api/video/$VIDEO_ID"
echo "  3. Wait for status to change to 'processed'"
echo ""
echo "To monitor processing:"
echo "  curl -H \"Authorization: Bearer $AUTH_TOKEN\" \\"
echo "    $API_BASE_URL/api/video/$VIDEO_ID/status | jq ."
echo ""
