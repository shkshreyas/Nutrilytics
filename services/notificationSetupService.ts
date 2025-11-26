import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationSetupService {
  static async requestNotificationPermission() {
    try {
      if (Platform.OS === 'android') {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        return finalStatus === 'granted';
      }

      return true; // On platforms other than Android, return true
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  static async setupNotifications() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }
}
