import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Mail, Lock, User, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Colors, GlobalStyles } from '../theme';

export default function AuthScreen() {
  const { signIn, signUp, checkEmailExists, googleSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'email' | 'password' | 'signup'>('email');
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const exists = await checkEmailExists(email);
      setEmailExists(exists);
      setStep(exists ? 'password' : 'signup');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name.trim() || !password || password.length < 6) {
      Alert.alert('Invalid Input', 'Please fill all fields and ensure password is at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name.trim());
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setStep('password');
        setEmailExists(true);
        Alert.alert('Email Already Registered', 'This email is already registered. Please enter your password to log in.');
      } else {
        Alert.alert('Sign Up Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await googleSignIn();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Google Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'password' || step === 'signup') {
      setStep('email');
      setPassword('');
      setName('');
    }
  };

  const renderEmailStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Mail size={48} color="#10B981" />
      </View>
      <Text style={styles.title}>Welcome to NutriLytics</Text>
      <Text style={styles.subtitle}>Enter your email to get started</Text>
      
      <View style={styles.inputContainer}>
        <Mail size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleEmailSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Colors.gradient}
          style={styles.primaryButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignIn}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#FFFFFF", "#F8FAFC"]}
          style={styles.googleButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPasswordStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
        <View style={styles.backButtonContainer}>
          <ArrowLeft size={20} color="#6B7280" />
        </View>
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <Lock size={48} color="#10B981" />
      </View>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Enter your password to sign in</Text>
      
      <View style={styles.inputContainer}>
        <Lock size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handlePasswordSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Colors.gradient}
          style={styles.primaryButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderSignUpStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
        <View style={styles.backButtonContainer}>
          <ArrowLeft size={20} color="#6B7280" />
        </View>
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <User size={48} color="#10B981" />
      </View>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Set up your profile to get started</Text>
      
      <View style={styles.inputContainer}>
        <User size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Lock size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSignUp}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Colors.gradient}
          style={styles.primaryButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={Colors.gradient}
        style={{ paddingTop: 64, paddingBottom: 32, paddingHorizontal: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, alignItems: 'center' }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Image source={require('../assets/images/icon.png')} style={{ width: 64, height: 64, marginBottom: 12 }} />
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 4 }}>NutriLytics</Text>
        <Text style={{ fontSize: 16, color: '#FFF', opacity: 0.9, marginBottom: 8 }}>Smart Food Safety</Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: Colors.card, borderRadius: 24, padding: 28, marginTop: -48, shadowColor: Colors.shadow, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 }}>
          {step === 'email' && renderEmailStep()}
          {step === 'password' && renderPasswordStep()}
          {step === 'signup' && renderSignUpStep()}
        </View>
        <View style={{ marginTop: 24, alignItems: 'center' }}>
          {step === 'password' && (
            <TouchableOpacity 
              style={styles.navigationLink} 
              onPress={() => setStep('signup')}
              activeOpacity={0.7}
            >
              <Text style={styles.navigationLinkText}>
                Don't have an account? <Text style={styles.navigationLinkHighlight}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          )}
          {step === 'signup' && (
            <TouchableOpacity 
              style={styles.navigationLink} 
              onPress={() => setStep('email')}
              activeOpacity={0.7}
            >
              <Text style={styles.navigationLinkText}>
                Already have an account? <Text style={styles.navigationLinkHighlight}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  googleButton: {
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  googleButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 8,
    color: Colors.textTertiary,
    fontSize: 13,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navigationLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  navigationLinkText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  navigationLinkHighlight: {
    color: Colors.primary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
}); 