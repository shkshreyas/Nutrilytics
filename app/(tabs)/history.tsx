import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, GlobalStyles } from '../../theme';
import { avatarOptions } from '../../assets/images/avatars';
import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/userService';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAvatar, setUserAvatar] = useState('😀');

  useEffect(() => {
    if (user) {
      loadScanHistory();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.uid) {
      UserService.getUserData(user.uid).then(data => {
        setUserAvatar(data?.avatar || '😀');
      });
    }
  }, [user]);

  const loadScanHistory = async () => {
    try {
      setLoading(true);
      if (user?.uid) {
        const history = await UserService.getScanHistory(user.uid);
        setScanHistory(history);
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
      // Show empty state for new users or if database fails
      setScanHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { key: 'all', label: 'All', count: scanHistory.length },
    { key: 'safe', label: 'Safe', count: scanHistory.filter(item => item.status === 'safe').length },
    { key: 'warning', label: 'Warning', count: scanHistory.filter(item => item.status === 'warning').length },
    { key: 'danger', label: 'Danger', count: scanHistory.filter(item => item.status === 'danger').length },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return '#059669';
      case 'warning': return '#F97316';
      case 'danger': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'danger': return AlertTriangle;
      default: return Clock;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  const filteredHistory = scanHistory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || item.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradient as [ColorValue, ColorValue]}
        style={{ paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexDirection: 'row', alignItems: 'center' }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Text style={{ fontSize: 36, marginRight: 12 }}>{userAvatar}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFF' }}>Scan History</Text>
          <Text style={{ fontSize: 14, color: '#FFF', opacity: 0.9 }}>Track your food safety journey</Text>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filtersScrollContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedFilter === filter.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter.key && styles.filterChipTextActive
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading scan history...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
          {filteredHistory.map((item) => {
            const StatusIcon = getStatusIcon(item.status);
            return (
              <View key={item.id} style={[GlobalStyles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, shadowColor: getStatusColor(item.status) + '33' }]}> 
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: getStatusColor(item.status) + '22', marginRight: 12 }}>
                    <StatusIcon size={22} color={getStatusColor(item.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 }}>{item.name}</Text>
                    <Text style={{ fontSize: 13, color: Colors.textTertiary, marginBottom: 2 }}>{item.brand}</Text>
                    <Text style={{ fontSize: 12, color: Colors.textTertiary, marginBottom: 4 }}>{formatDate(item.scanDate)}</Text>
                    {item.allergens.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {item.allergens.map((allergen: string, index: number) => (
                          <View key={index} style={{ backgroundColor: Colors.danger + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 6, marginBottom: 2 }}>
                            <Text style={{ fontSize: 10, color: Colors.danger, fontWeight: '700' }}>{allergen}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'center', marginLeft: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: getStatusColor(item.status), marginBottom: 2 }}>{item.confidence}%</Text>
                  <Text style={{ fontSize: 22 }}>{userAvatar}</Text>
                </View>
              </View>
            );
          })}
          {filteredHistory.length === 0 && (
            <View style={[GlobalStyles.card, { alignItems: 'center', backgroundColor: Colors.card }]}> 
              <Text style={{ fontSize: 40, marginBottom: 8, opacity: 0.7 }}>{userAvatar}</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textSecondary, marginBottom: 2 }}>No scans found</Text>
              <Text style={{ fontSize: 14, color: Colors.textTertiary, textAlign: 'center' }}>
                {searchQuery ? 'Try adjusting your search' : 'Start scanning foods to see your history'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
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
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.card,
  },
  filtersScrollContent: {
    paddingVertical: 4,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: Colors.background,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  historyList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  itemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  allergenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergenChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 2,
  },
  allergenChipText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '500',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});