@echo off
REM Test webhook script for Windows
REM Usage: test-webhook.bat [local|production]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=local

set WEBHOOK_SECRET=%WEBHOOK_SECRET%
if "%WEBHOOK_SECRET%"=="" set WEBHOOK_SECRET=test_secret_123

echo Testing RevenueCat Webhook
echo Environment: %ENVIRONMENT%
echo.

REM Set URL based on environment
if "%ENVIRONMENT%"=="local" (
    REM For local testing, you need to manually set your project ID
    set PROJECT_ID=your-project-id
    set URL=http://localhost:5001/!PROJECT_ID!/us-central1/revenueCatWebhook
    echo Local URL: !URL!
) else if "%ENVIRONMENT%"=="production" (
    echo Error: Production testing not implemented in batch script
    echo Please use PowerShell or bash script
    exit /b 1
) else (
    echo Error: Invalid environment. Use 'local' or 'production'
    exit /b 1
)

echo.
echo Test 1: Initial Purchase (Trial)
curl -X POST "!URL!" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %WEBHOOK_SECRET%" ^
  -d @test-payload.json ^
  -w "\nStatus: %%{http_code}\n"

echo.
echo Test 2: Renewal
curl -X POST "!URL!" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %WEBHOOK_SECRET%" ^
  -d "{\"api_version\":\"1.0\",\"event\":{\"type\":\"RENEWAL\",\"app_user_id\":\"test_user_123\",\"product_id\":\"nutrilytics_monthly\",\"period_type\":\"NORMAL\",\"purchased_at_ms\":1699564800000,\"expiration_at_ms\":1702243200000,\"store\":\"PLAY_STORE\",\"environment\":\"SANDBOX\",\"entitlement_ids\":[\"premium\"],\"presented_offering_id\":\"default\",\"transaction_id\":\"GPA.1234-5678-9012-34568\",\"original_transaction_id\":\"GPA.1234-5678-9012-34567\",\"is_trial_conversion\":true,\"price\":199,\"currency\":\"INR\",\"takehome_percentage\":0.85,\"cancellation_reason\":null}}" ^
  -w "\nStatus: %%{http_code}\n"

echo.
echo All tests completed
echo.
echo Check logs in terminal running 'npm run serve'

endlocal
