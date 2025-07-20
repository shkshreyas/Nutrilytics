import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme';

interface SplashScreenProps {
  message?: string;
}

export default function SplashScreen({ message = "Loading..." }: SplashScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.logo}
          />
          <Text style={styles.title}>NutriLytics</Text>
          <Text style={styles.subtitle}>Smart Food Safety</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 32,
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
}); 