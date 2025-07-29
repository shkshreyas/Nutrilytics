import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Camera, Clock, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { useEffect, useState } from 'react';
import { Colors, GlobalStyles } from '../../theme';
import SplashScreen from '../../components/SplashScreen';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, userDataLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    { icon: Shield, label: 'Foods Scanned', value: userData?.foodsScanned?.toString() || '0', color: '#10B981' },
    { icon: AlertTriangle, label: 'Allergens Found', value: userData?.allergensFound?.toString() || '0', color: '#F97316' },
    { icon: CheckCircle, label: 'Safe Foods', value: userData?.safeFoods?.toString() || '0', color: '#059669' },
    { icon: Clock, label: 'Days Safe', value: userData?.daysSafe?.toString() || '0', color: '#3B82F6' },
  ];

  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadRecentScans();
    }
  }, [user]);

  const loadRecentScans = async () => {
    try {
      if (user?.uid) {
        // Fetch real scan history from database
        const history = await UserService.getScanHistory(user.uid);
        // Get the 3 most recent scans
        const recent = history.slice(0, 3).map(scan => ({
          name: scan.name,
          status: scan.status,
          allergens: scan.allergens,
          time: formatTimeAgo(scan.scanDate)
        }));
        setRecentScans(recent);
      }
    } catch (error) {
      console.error('Error loading recent scans:', error);
      // Show empty state if no scans
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={Colors.gradient as [ColorValue, ColorValue]}
        style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 40, marginRight: 10 }}>{userData?.avatar || '😀'}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={styles.greeting}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Good morning, {userData?.name || user?.displayName || 'User'}! 👋
            </Text>
            <Text style={styles.subtitle}>Keep your meals safe and healthy</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity
          style={[GlobalStyles.roundedButton, { backgroundColor: Colors.info, marginBottom: 30, elevation: 8, shadowColor: Colors.info }]}
          onPress={() => router.push('/scan')}
          activeOpacity={0.85}>
          <LinearGradient
            colors={Colors.gradientBlue as [ColorValue, ColorValue]}
            style={{ borderRadius: 24, width: '100%', alignItems: 'center' as const, paddingVertical: 24 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Camera size={40} color="#FFFFFF" />
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 8 }}>Scan Your Food</Text>
            <Text style={{ fontSize: 15, color: '#FFF', opacity: 0.85, marginTop: 2 }}>Detect allergens instantly</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <Text style={GlobalStyles.sectionTitle}>Your Safety Stats</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <View key={index} style={[GlobalStyles.card, { width: (width - 60) / 2, alignItems: 'center' as const, backgroundColor: Colors.card, shadowColor: stat.color + '55' }]}>
                  <View style={[GlobalStyles.iconCircle, { backgroundColor: stat.color + '22', alignItems: 'center' as const }]}>
                    <IconComponent size={28} color={stat.color} />
                  </View>
                  <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.text }}>{stat.value}</Text>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center' as const }}>{stat.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={GlobalStyles.sectionTitle}>Recent Scans</Text>
          {recentScans.length > 0 ? (
            recentScans.map((scan, index) => (
              <View key={index} style={[GlobalStyles.card, { flexDirection: 'row', alignItems: 'center' as const, justifyContent: 'space-between' as const, backgroundColor: Colors.card, shadowColor: (scan.status === 'safe' ? Colors.safe : Colors.warning) + '33' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2 }}>{scan.name}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textTertiary, marginBottom: 4 }}>{scan.time}</Text>
                  {scan.allergens && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {scan.allergens.map((allergen: string, i: number) => (
                        <View key={i} style={{ backgroundColor: Colors.danger + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 6, marginBottom: 2 }}>
                          <Text style={{ fontSize: 10, color: Colors.danger, fontWeight: '700' }}>{allergen}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: (scan.status === 'safe' ? Colors.safe : Colors.warning) }}>
                  {scan.status === 'safe' ? (
                    <CheckCircle size={18} color="#FFFFFF" />
                  ) : (
                    <AlertTriangle size={18} color="#FFFFFF" />
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={[GlobalStyles.card, { alignItems: 'center' as const, backgroundColor: Colors.card }]}>
              <Image source={require('../../assets/images/icon.png')} style={{ width: 40, height: 40, marginBottom: 8, opacity: 0.7 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textSecondary, marginBottom: 2 }}>No scans yet</Text>
              <Text style={{ fontSize: 13, color: Colors.textTertiary, textAlign: 'center' as const }}>Start scanning foods to see your recent activity</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  scanButton: {
    marginTop: -20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scanButtonGradient: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  scanButtonSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  statsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 20,
  },
  scanItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  scanInfo: {
    flex: 1,
  },
  scanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  scanTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  allergenTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergenTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  allergenText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});