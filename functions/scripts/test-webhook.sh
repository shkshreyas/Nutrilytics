#!/bin/bash

# Test webhook script for local development
# Usage: ./scripts/test-webhook.sh [local|production]

set -e

# Configuration
ENVIRONMENT=${1:-local}
WEBHOOK_SECRET=${WEBHOOK_SECRET:-"test_secret_123"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing RevenueCat Webhook${NC}"
echo "Environment: $ENVIRONMENT"
echo ""

# Set URL based on environment
if [ "$ENVIRONMENT" = "local" ]; then
    # Get project ID from .firebaserc
    PROJECT_ID=$(grep -o '"default": "[^"]*' ../.firebaserc | cut -d'"' -f4)
    URL="http://localhost:5001/${PROJECT_ID}/us-central1/revenueCatWebhook"
    echo "Local URL: $URL"
elif [ "$ENVIRONMENT" = "production" ]; then
    # Get deployed function URL
    URL=$(firebase functions:list | grep revenueCatWebhook | awk '{print $2}')
    if [ -z "$URL" ]; then
        echo -e "${RED}Error: Could not find deployed function URL${NC}"
        echo "Run: firebase functions:list"
        exit 1
    fi
    echo "Production URL: $URL"
else
    echo -e "${RED}Error: Invalid environment. Use 'local' or 'production'${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Test 1: Initial Purchase (Trial)${NC}"
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -d @test-payload.json \
  -w "\nStatus: %{http_code}\n"

echo ""
echo -e "${YELLOW}Test 2: Renewal${NC}"
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -d '{
    "api_version": "1.0",
    "event": {
      "type": "RENEWAL",
      "app_user_id": "test_user_123",
      "product_id": "nutrilytics_monthly",
      "period_type": "NORMAL",
      "purchased_at_ms": 1699564800000,
      "expiration_at_ms": 1702243200000,
      "store": "PLAY_STORE",
      "environment": "SANDBOX",
      "entitlement_ids": ["premium"],
      "presented_offering_id": "default",
      "transaction_id": "GPA.1234-5678-9012-34568",
      "original_transaction_id": "GPA.1234-5678-9012-34567",
      "is_trial_conversion": true,
      "price": 199,
      "currency": "INR",
      "takehome_percentage": 0.85,
      "cancellation_reason": null
    }
  }' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo -e "${YELLOW}Test 3: Cancellation${NC}"
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -d '{
    "api_version": "1.0",
    "event": {
      "type": "CANCELLATION",
      "app_user_id": "test_user_123",
      "product_id": "nutrilytics_monthly",
      "period_type": "NORMAL",
      "purchased_at_ms": 1699564800000,
      "expiration_at_ms": 1702243200000,
      "store": "PLAY_STORE",
      "environment": "SANDBOX",
      "entitlement_ids": ["premium"],
      "presented_offering_id": "default",
      "transaction_id": "GPA.1234-5678-9012-34568",
      "original_transaction_id": "GPA.1234-5678-9012-34567",
      "is_trial_conversion": false,
      "price": 199,
      "currency": "INR",
      "takehome_percentage": 0.85,
      "cancellation_reason": "customer_cancelled"
    }
  }' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo -e "${YELLOW}Test 4: Billing Issue${NC}"
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -d '{
    "api_version": "1.0",
    "event": {
      "type": "BILLING_ISSUE",
      "app_user_id": "test_user_123",
      "product_id": "nutrilytics_monthly",
      "period_type": "NORMAL",
      "purchased_at_ms": 1699564800000,
      "expiration_at_ms": 1702243200000,
      "store": "PLAY_STORE",
      "environment": "SANDBOX",
      "entitlement_ids": ["premium"],
      "presented_offering_id": "default",
      "transaction_id": "GPA.1234-5678-9012-34568",
      "original_transaction_id": "GPA.1234-5678-9012-34567",
      "is_trial_conversion": false,
      "price": 199,
      "currency": "INR",
      "takehome_percentage": 0.85,
      "cancellation_reason": null
    }
  }' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo -e "${GREEN}✓ All tests completed${NC}"
echo ""
echo "Check logs:"
if [ "$ENVIRONMENT" = "local" ]; then
    echo "  - Check terminal running 'npm run serve'"
else
    echo "  - firebase functions:log --only revenueCatWebhook"
fi
