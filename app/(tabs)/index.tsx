import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ColorValue,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  Camera,
  Clock,
  TrendingUp,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
  Lock,
  ChevronRight,
  Zap,
} from 'lucide-react-native';
import NutrientChart from '../../components/NutrientChart';
import SubscriptionButton from '../../components/SubscriptionButton';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { useEffect, useState } from 'react';
import { Colors, GlobalStyles } from '../../theme';
import SplashScreen from '../../components/SplashScreen';
import { GlassmorphismCard } from '../../components/design-system/GlassmorphismCard';
import StreakCounter from '../../components/StreakCounter';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, userDataLoading, isPremium } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);
  const [streak, setStreak] = useState(3); // Mock streak for demo

  useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }
    loadUserData();
  }, [user]);

  if (userDataLoading) {
    return <SplashScreen message="Loading your data..." />;
  }

  const loadUserData = async () => {
    try {
      if (user?.uid) {
        const data = await UserService.getUserData(user.uid);
        setUserData(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickStats = [
    {
      icon: Shield,
      label: 'Foods Scanned',
      value: userData?.foodsScanned?.toString() || '0',
      color: Colors.primaryNeon,
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      icon: AlertTriangle,
      label: 'Allergens',
      value: userData?.allergensFound?.toString() || '0',
      color: Colors.warning,
      bg: 'rgba(249, 115, 22, 0.1)',
    },
    {
      icon: CheckCircle,
      label: 'Safe Foods',
      value: userData?.safeFoods?.toString() || '0',
      color: Colors.secondaryNeon,
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    {
      icon: Clock,
      label: 'Days Safe',
      value: userData?.daysSafe?.toString() || '0',
      color: Colors.accent,
      bg: 'rgba(251, 191, 36, 0.1)',
    },
  ];

  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [nutrientData, setNutrientData] = useState([
    { nutrient: 'Protein', amount: 65, unit: 'g', recommended: 50 },
    { nutrient: 'Carbs', amount: 275, unit: 'g', recommended: 300 },
    { nutrient: 'Fats', amount: 55, unit: 'g', recommended: 65 },
    { nutrient: 'Fiber', amount: 18, unit: 'g', recommended: 25 },
    { nutrient: 'Sugar', amount: 35, unit: 'g', recommended: 25 },
    { nutrient: 'Sodium', amount: 1800, unit: 'mg', recommended: 2300 },
  ]);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadRecentScans();
      calculateNutrientData();
    }
  }, [user]);

  const calculateNutrientData = async () => {
    try {
      if (user?.uid) {
        const scans = await UserService.getScanHistory(user.uid);
      }
    } catch (error) {
      console.error('Error calculating nutrient data:', error);
    }
  };

  const loadRecentScans = async () => {
    try {
      if (user?.uid) {
        const history = await UserService.getScanHistory(user.uid);
        const recent = history.slice(0, 3).map((scan) => ({
          name: scan.name,
          status: scan.status,
          allergens: scan.allergens,
          time: formatTimeAgo(scan.scanDate),
        }));
        setRecentScans(recent);
      }
    } catch (error) {
      console.error('Error loading recent scans:', error);
      setRecentScans([]);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={Colors.backgroundGradient}
            style={styles.headerBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello, {userData?.name?.split(' ')[0] || 'Friend'}!</Text>
              <Text style={styles.subtitle}>Ready to eat healthy today?</Text>
            </View>
            <StreakCounter streak={streak} />
          </View>
        </View>

        {/* Hero Scan Button */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.scanButtonWrapper}
            onPress={() => router.push('/scan')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={Colors.gradient}
              style={styles.scanButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.scanIconContainer}>
                <Camera size={32} color="#FFF" />
              </View>
              <View style={styles.scanTextContainer}>
                <Text style={styles.scanTitle}>Scan Food</Text>
                <Text style={styles.scanSubtitle}>Instant Analysis</Text>
              </View>
              <View style={styles.scanArrow}>
                <ChevronRight size={24} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.sectionContainer}>
          <Text style={GlobalStyles.sectionTitle}>Daily Overview</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <GlassmorphismCard
                  key={index}
                  style={styles.statCard}
                  intensity={60}
                  hasGradientBorder={false}
                >
                  <View style={[styles.iconCircle, { backgroundColor: stat.bg }]}>
                    <IconComponent size={24} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </GlassmorphismCard>
              );
            })}
          </View>
        </View>

        {/* Premium Insights Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={GlobalStyles.sectionTitle}>Nutrient Insights</Text>
            {!isPremium && (
              <View style={styles.premiumBadge}>
                <Zap size={12} color="#FFF" fill="#FFF" />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </View>

          <View style={styles.chartContainer}>
            <NutrientChart data={nutrientData} />
            {!isPremium && (
              <BlurView intensity={20} style={styles.lockOverlay}>
                <GlassmorphismCard style={styles.lockCard} intensity={90} hasGradientBorder>
                  <Lock size={32} color={Colors.warning} />
                  <Text style={styles.lockTitle}>Unlock Insights</Text>
                  <Text style={styles.lockSubtitle}>
                    Get detailed breakdown of your nutrient intake.
                  </Text>
                  <TouchableOpacity
                    style={styles.unlockButton}
                    onPress={() => router.push('/subscription')}
                  >
                    <Text style={styles.unlockButtonText}>Go Premium</Text>
                  </TouchableOpacity>
                </GlassmorphismCard>
              </BlurView>
            )}
          </View>
        </View>

        {/* Recent Scans */}
        <View style={styles.sectionContainer}>
          <Text style={GlobalStyles.sectionTitle}>Recent History</Text>
          {recentScans.length > 0 ? (
            recentScans.map((scan, index) => (
              <GlassmorphismCard key={index} style={styles.historyCard} intensity={40}>
                <View style={styles.historyRow}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyName}>{scan.name}</Text>
                    <Text style={styles.historyTime}>{scan.time}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: scan.status === 'safe' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)' },
                    ]}
                  >
                    {scan.status === 'safe' ? (
                      <CheckCircle size={20} color={Colors.safe} />
                    ) : (
                      <AlertTriangle size={20} color={Colors.warning} />
                    )}
                  </View>
                </View>
              </GlassmorphismCard>
            ))
          ) : (
            <GlassmorphismCard style={styles.emptyState} intensity={40}>
              <Text style={styles.emptyText}>No scans yet</Text>
              <Text style={styles.emptySubtext}>Start scanning to track your history</Text>
            </GlassmorphismCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  heroSection: {
    padding: 20,
    marginTop: -10,
  },
  scanButtonWrapper: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderRadius: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
  },
  scanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  scanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scanSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  scanArrow: {
    opacity: 0.8,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    marginBottom: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chartContainer: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    padding: 16,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lockCard: {
    width: '80%',
    alignItems: 'center',
    padding: 24,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  unlockButton: {
    backgroundColor: Colors.text,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  unlockButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyCard: {
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
