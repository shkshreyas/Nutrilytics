# Cloud Functions Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

### Environment Setup
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Firebase project created
- [ ] Node.js 18+ installed

### Code Preparation
- [ ] Dependencies installed (`cd functions && npm install`)
- [ ] Code builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] Test payload reviewed (`test-payload.json`)

### Configuration
- [ ] Webhook secret generated
- [ ] Webhook secret set in Firebase config
- [ ] Webhook secret saved securely (for RevenueCat)
- [ ] Firebase project ID confirmed

## Deployment

### Firebase Deployment
- [ ] Functions deployed (`npm run deploy`)
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)
- [ ] All functions show ACTIVE status
- [ ] Function URLs obtained (`firebase functions:list`)

### Function Verification
- [ ] `revenueCatWebhook` deployed
- [ ] `scheduledQuotaReset` deployed
- [ ] `scheduledTrialCheck` deployed
- [ ] No deployment errors in logs

## RevenueCat Configuration

### Webhook Setup
- [ ] RevenueCat dashboard accessed
- [ ] Webhook URL added (from function URL)
- [ ] Authorization header set (`Bearer YOUR_SECRET`)
- [ ] All events enabled:
  - [ ] Initial Purchase
  - [ ] Renewal
  - [ ] Cancellation
  - [ ] Uncancellation
  - [ ] Non-Renewing Purchase
  - [ ] Expiration
  - [ ] Billing Issue
  - [ ] Product Change
- [ ] Test webhook sent
- [ ] Test webhook successful (200 OK)

### Verification
- [ ] Webhook logs show test event
- [ ] No errors in function logs
- [ ] Test payload processed correctly

## Testing

### Local Testing
- [ ] Emulator started (`npm run serve`)
- [ ] Test script executed (`test-webhook.sh` or `.bat`)
- [ ] All test cases pass
- [ ] Logs show correct processing

### Sandbox Testing
- [ ] Test account added in Google Play Console
- [ ] Test purchase completed in app
- [ ] Webhook received in Cloud Functions
- [ ] Firestore data updated correctly
- [ ] App reflects subscription status

### End-to-End Testing
- [ ] Trial activation tested
- [ ] Premium features unlock
- [ ] Quota tracking works
- [ ] Cancellation flow tested
- [ ] Win-back offer created

## Monitoring Setup

### Firebase Console
- [ ] Functions dashboard reviewed
- [ ] Metrics visible (invocations, errors, execution time)
- [ ] Logs accessible
- [ ] Alerts configured:
  - [ ] High error rate alert
  - [ ] Function crash alert
  - [ ] Execution time alert

### Scheduled Functions
- [ ] Quota reset schedule verified (midnight UTC)
- [ ] Trial check schedule verified (every 6 hours)
- [ ] First execution logs reviewed
- [ ] No errors in scheduled runs

## App Integration

### Client-Side Updates
- [ ] Notification listener added to app
- [ ] Trial reminder handling implemented
- [ ] Grace period warnings shown
- [ ] Subscription sync on app launch
- [ ] Manual sync button added (optional)

### Data Verification
- [ ] App reads subscription data from Firestore
- [ ] Premium status updates in real-time
- [ ] Usage quotas display correctly
- [ ] Notifications appear in app

## Security

### Access Control
- [ ] Firestore rules deployed
- [ ] Users can read own data only
- [ ] Cloud Functions can write subscription data
- [ ] Analytics collection protected

### Secrets Management
- [ ] Webhook secret not in git
- [ ] Environment variables secure
- [ ] Firebase config not exposed
- [ ] API keys protected

## Documentation

### Team Knowledge
- [ ] README.md reviewed
- [ ] DEPLOYMENT_GUIDE.md shared with team
- [ ] INTEGRATION.md shared with app developers
- [ ] Webhook URL documented
- [ ] Monitoring procedures documented

### Runbooks
- [ ] Deployment procedure documented
- [ ] Rollback procedure documented
- [ ] Troubleshooting guide available
- [ ] Emergency contacts listed

## Production Readiness

### Performance
- [ ] Function timeout appropriate (60s default)
- [ ] Memory allocation sufficient (256MB default)
- [ ] Batch sizes optimized (500 for quota reset)
- [ ] Indexes deployed for queries

### Cost Management
- [ ] Usage within free tier confirmed
- [ ] Budget alerts set up
- [ ] Cost monitoring enabled
- [ ] Optimization opportunities identified

### Reliability
- [ ] Error handling tested
- [ ] Retry logic verified
- [ ] Fallback mechanisms in place
- [ ] Monitoring alerts active

## Post-Deployment

### First 24 Hours
- [ ] Monitor logs continuously
- [ ] Check for errors
- [ ] Verify webhook events processing
- [ ] Confirm scheduled functions running

### First Week
- [ ] Review metrics daily
- [ ] Check user feedback
- [ ] Monitor costs
- [ ] Optimize if needed

### Ongoing
- [ ] Weekly log review
- [ ] Monthly cost review
- [ ] Quarterly performance review
- [ ] Update documentation as needed

## Rollback Plan

### If Issues Occur
- [ ] Rollback procedure documented
- [ ] Previous version available
- [ ] Database backup available
- [ ] Communication plan ready

### Rollback Steps
1. [ ] Identify issue
2. [ ] Notify team
3. [ ] Stop affected functions
4. [ ] Deploy previous version
5. [ ] Verify rollback successful
6. [ ] Document incident

## Sign-Off

### Deployment Completed By
- Name: ___________________________
- Date: ___________________________
- Signature: _______________________

### Verified By
- Name: ___________________________
- Date: ___________________________
- Signature: _______________________

### Production Approval
- Name: ___________________________
- Date: ___________________________
- Signature: _______________________

---

## Notes

Use this section for any additional notes, issues encountered, or lessons learned:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
