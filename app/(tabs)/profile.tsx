import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Shield, Bell, Settings, CircleHelp as HelpCircle, ChevronRight, CreditCard as Edit, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Heart, Database, LogOut, Pencil, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/userService';
import { avatarOptions } from '../../assets/images/avatars';
import { Colors, GlobalStyles } from '../../theme';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const { user, userData, signOutUser, refreshUserData } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [autoScan, setAutoScan] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [userAllergens, setUserAllergens] = useState<any[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('😀');
  const [addAllergenModal, setAddAllergenModal] = useState(false);
  const [newAllergen, setNewAllergen] = useState('');
  const [manageAllergensModal, setManageAllergensModal] = useState(false);
  const [editingAllergenIndex, setEditingAllergenIndex] = useState<number | null>(null);
  const [editingAllergenName, setEditingAllergenName] = useState('');

  useEffect(() => {
    if (userData?.avatar) {
      setSelectedAvatar(userData.avatar);
    }
  }, [userData]);

  // Load user's allergens when userData changes
  useEffect(() => {
    if (userData?.allergens) {
      setUserAllergens(userData.allergens.map((allergen: string) => ({
        name: allergen,
        severity: 'high',
        color: '#DC2626'
      })));
    }
  }, [userData]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await signOutUser();
              // The app will automatically navigate to auth screen when user becomes null
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          }
        }
      ]
    );
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);
    Haptics.selectionAsync();
    try {
      if (user?.uid) {
        await UserService.updateUserSettings(user.uid, { notifications: value });
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const handleAutoScanToggle = async (value: boolean) => {
    setAutoScan(value);
    Haptics.selectionAsync();
    try {
      if (user?.uid) {
        await UserService.updateUserSettings(user.uid, { autoScan: value });
      }
    } catch (error) {
      console.error('Error updating auto-scan settings:', error);
    }
  };

  const handleHapticToggle = async (value: boolean) => {
    setHapticFeedback(value);
    Haptics.selectionAsync();
    try {
      if (user?.uid) {
        await UserService.updateUserSettings(user.uid, { hapticFeedback: value });
      }
    } catch (error) {
      console.error('Error updating haptic settings:', error);
    }
  };

  const addAllergen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNewAllergen('');
    setAddAllergenModal(true);
  };

  const saveAllergen = async () => {
    if (!newAllergen.trim() || !user?.uid) return;
    try {
      const newAllergens = [...userAllergens, { name: newAllergen.trim(), severity: 'high', color: '#DC2626' }];
      setUserAllergens(newAllergens);
      await UserService.updateUserAllergens(user.uid, newAllergens.map(a => a.name));
      setAddAllergenModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error adding allergen:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleEditProfile = () => {
    setNewName(userData?.name || '');
    setSelectedAvatar(userData?.avatar || '😀');
    setEditingName(true);
  };

  const saveName = async () => {
    if (!newName.trim() || !user?.uid) return;
    try {
      await UserService.updateUserData(user.uid, { name: newName.trim(), avatar: selectedAvatar });
      await refreshUserData(); // Refresh user data from context
      setEditingName(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to update name');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const openManageAllergens = () => {
    setManageAllergensModal(true);
    setEditingAllergenIndex(null);
    setEditingAllergenName('');
  };

  const startEditAllergen = (index: number, name: string) => {
    setEditingAllergenIndex(index);
    setEditingAllergenName(name);
  };

  const saveEditAllergen = async () => {
    if (editingAllergenIndex === null || !editingAllergenName.trim() || !user?.uid) return;
    const updated = [...userAllergens];
    updated[editingAllergenIndex] = { ...updated[editingAllergenIndex], name: editingAllergenName.trim() };
    setUserAllergens(updated);
    setEditingAllergenIndex(null);
    setEditingAllergenName('');
    await UserService.updateUserAllergens(user.uid, updated.map(a => a.name));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteAllergen = async (index: number) => {
    if (!user?.uid) return;
    const updated = userAllergens.filter((_, i) => i !== index);
    setUserAllergens(updated);
    await UserService.updateUserAllergens(user.uid, updated.map(a => a.name));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const stats = [
    { label: 'Foods Scanned', value: userData?.foodsScanned?.toString() || '0', icon: Database, color: '#3B82F6' },
    { label: 'Safe Foods', value: userData?.safeFoods?.toString() || '0', icon: CheckCircle, color: '#059669' },
    { label: 'Allergens Avoided', value: userData?.allergensFound?.toString() || '0', icon: Shield, color: '#DC2626' },
    { label: 'Days Safe', value: userData?.daysSafe?.toString() || '0', icon: Heart, color: '#EC4899' },
  ];

  const settingsItems = [
    {
      title: 'Manage Allergens',
      subtitle: 'Update your allergen profile',
      icon: AlertTriangle,
      color: '#F97316',
      onPress: openManageAllergens,
    },
    {
      title: 'Help & Support',
      subtitle: 'Get help using the app',
      icon: HelpCircle,
      color: '#3B82F6',
      onPress: () => Alert.alert('Support', 'Contact us at shkshreyaskumar@gmail.com'),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 32 }}>{userData?.avatar || '😀'}</Text>
          </View>
          <Text style={styles.userName}>
            {userData?.name ? userData.name : userData ? 'Set your name' : 'Loading...'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || 'user@email.com'}</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Edit size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      {editingName && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '90%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Edit Profile</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 16 }}
            />
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Choose Avatar</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
              {avatarOptions.map((avatar, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedAvatar(avatar)}
                  style={{
                    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', margin: 4,
                    borderWidth: selectedAvatar === avatar ? 2 : 0,
                    borderColor: selectedAvatar === avatar ? '#10B981' : 'transparent',
                    backgroundColor: selectedAvatar === avatar ? '#ECFDF5' : '#F3F4F6',
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => { setEditingName(false); Haptics.selectionAsync(); }} style={{ marginRight: 16 }}>
                <Text style={{ color: '#6B7280', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveName}>
                <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 16 }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Modal visible={addAllergenModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Add Allergen</Text>
            <TextInput
              value={newAllergen}
              onChangeText={setNewAllergen}
              placeholder="Enter allergen name"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 16 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => { setAddAllergenModal(false); Haptics.selectionAsync(); }} style={{ marginRight: 16 }}>
                <Text style={{ color: '#6B7280', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveAllergen}>
                <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 16 }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={manageAllergensModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Manage Allergens</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {userAllergens.length === 0 && (
                <Text style={{ color: Colors.textTertiary, textAlign: 'center', marginVertical: 16 }}>No allergens added yet.</Text>
              )}
              {userAllergens.map((allergen, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  {editingAllergenIndex === idx ? (
                    <TextInput
                      value={editingAllergenName}
                      onChangeText={setEditingAllergenName}
                      style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, fontSize: 15, marginRight: 8 }}
                      autoFocus
                    />
                  ) : (
                    <Text style={{ flex: 1, fontSize: 15 }}>{allergen.name}</Text>
                  )}
                  {editingAllergenIndex === idx ? (
                    <TouchableOpacity onPress={saveEditAllergen} style={{ marginRight: 8 }}>
                      <Text style={{ color: '#10B981', fontWeight: '700' }}>Save</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => startEditAllergen(idx, allergen.name)} style={{ marginRight: 8 }}>
                      <Pencil size={18} color={Colors.info} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => deleteAllergen(idx)}>
                    <Trash2 size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => { setManageAllergensModal(false); Haptics.selectionAsync(); }}>
                <Text style={{ color: '#6B7280', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Safety Stats</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                    <IconComponent size={20} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.allergenSection}>
          <Text style={styles.sectionTitle}>Your Allergens</Text>
          {userAllergens.map((allergen, index) => (
            <View key={index} style={styles.allergenItem}>
              <View style={styles.allergenInfo}>
                <View style={[styles.allergenDot, { backgroundColor: allergen.color }]} />
                <Text style={styles.allergenName}>{allergen.name}</Text>
              </View>
              <View style={[styles.severityBadge, { backgroundColor: `${allergen.color}15` }]}>
                <Text style={[styles.severityText, { color: allergen.color }]}>
                  {allergen.severity}
                </Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addAllergenButton} onPress={addAllergen}>
            <Text style={styles.addAllergenText}>+ Add Allergen</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Bell size={20} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>Get alerts about allergens</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={notifications ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Shield size={20} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Auto-scan Mode</Text>
                <Text style={styles.settingSubtitle}>Automatically analyze images</Text>
              </View>
            </View>
            <Switch
              value={autoScan}
              onValueChange={handleAutoScanToggle}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={autoScan ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Heart size={20} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Haptic Feedback</Text>
                <Text style={styles.settingSubtitle}>Feel vibrations for alerts</Text>
              </View>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={handleHapticToggle}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={hapticFeedback ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          {settingsItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                    <IconComponent size={20} color={item.color} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#DC262615' }]}>
                <LogOut size={20} color="#DC2626" />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Sign Out</Text>
                <Text style={styles.menuSubtitle}>Sign out of your account</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Nutrilytics v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with ❤️ for your safety</Text>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsSection: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  allergenSection: {
    marginBottom: 30,
  },
  allergenItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  allergenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allergenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  allergenName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  addAllergenButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addAllergenText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuSection: {
    marginBottom: 30,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});