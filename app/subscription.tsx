import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors, GlobalStyles } from '../theme';
import SubscriptionService from '../services/subscriptionService';
import { SUBSCRIPTION_PLANS } from '../config/subscriptions';

const subscriptionFeatures = [
  'Unlimited food scans',
  'Detailed nutritional analysis',
  'Custom allergen alerts',
  'Weekly health reports',
  'Priority customer support',
  'Export nutrition data',
];

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [offerings, setOfferings] = useState<any>(null);
  const subscriptionService = SubscriptionService.getInstance();

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const offerings = await subscriptionService.getOfferings();
      setOfferings(offerings);
      setLoading(false);
    } catch (error) {
      console.error('Error loading offerings:', error);
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !offerings) return;

    try {
      setLoading(true);
      const packageToPurchase = offerings.availablePackages.find(
        (pkg: any) => pkg.identifier === selectedPlan
      );

      if (!packageToPurchase) {
        throw new Error('Selected package not found');
      }

      const customerInfo = await subscriptionService.purchasePackage(
        packageToPurchase
      );

      if (customerInfo) {
        Alert.alert(
          'Success!',
          'Thank you for subscribing to NutriLytics Premium!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const customerInfo = await subscriptionService.restorePurchases();

      if (customerInfo && customerInfo.entitlements.active.premium) {
        Alert.alert('Success!', 'Your subscription has been restored!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(
          'No Subscription Found',
          'No active subscription was found.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={Colors.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Star size={40} color="#FFD700" />
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <Text style={styles.headerSubtitle}>
          Get unlimited access to all features
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Premium Features</Text>
          {subscriptionFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <CheckCircle2 size={20} color={Colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plansContainer}>
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlan,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
              <Text style={styles.planDuration}>per {plan.duration}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeButton,
            !selectedPlan && styles.subscribeButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={!selectedPlan || loading}
        >
          <Text style={styles.subscribeButtonText}>
            {loading ? 'Processing...' : 'Start Subscription'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreButtonText}>Restore Purchase</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By subscribing, you agree to our terms of service and privacy policy.
          Subscription will auto-renew unless canceled 24 hours before the
          renewal date.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 16,
    color: Colors.text,
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlan: {
    borderColor: Colors.primary,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  planDuration: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
