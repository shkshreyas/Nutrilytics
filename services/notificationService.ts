import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Special quotes for different meal times
const mealQuotes = {
  breakfast: [
    "🌅 Good morning! Start your day with mindful eating. Scan your breakfast to stay safe!",
    "☀️ Rise and shine! Don't forget to check your breakfast ingredients for allergens.",
    "🍳 Breakfast is the most important meal. Make it safe with NutriLytics!",
    "🌞 New day, new opportunities to eat safely. Scan your morning meal!",
    "🥞 Fuel your day right! Check your breakfast for hidden allergens.",
    "☕ Good morning! Let's make sure your breakfast is allergen-free.",
    "🌅 Start your day with confidence. Scan your breakfast with NutriLytics!",
    "🍞 Breakfast time! Don't forget to scan before you eat.",
  ],
  lunch: [
    "🌞 Lunch break! Take a moment to scan your meal for allergens.",
    "🥪 Midday fuel check! Ensure your lunch is safe with NutriLytics.",
    "🍽️ Lunch time! Scan your food to avoid any allergic reactions.",
    "🌤️ Halfway through the day! Keep it safe with a quick scan.",
    "🥗 Healthy lunch starts with safe ingredients. Scan before you eat!",
    "🍕 Lunch break safety first! Check your meal with NutriLytics.",
    "🌞 Midday meal check! Don't let allergens ruin your afternoon.",
    "🍱 Lunch time! A quick scan can save your day.",
  ],
  dinner: [
    "🌙 Dinner time! End your day safely by scanning your meal.",
    "🍽️ Evening meal check! Ensure your dinner is allergen-free.",
    "🌆 Dinner safety first! Scan your food before enjoying.",
    "🌃 Night meal scan! Don't let allergens disturb your sleep.",
    "🍜 Dinner time! Make it safe with a quick allergen check.",
    "🌙 Evening fuel! Scan your dinner to stay safe and healthy.",
    "🍖 Dinner break! Check your meal for hidden allergens.",
    "🌆 End your day right! Scan your dinner with NutriLytics.",
  ]
};

export class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  }

  static async scheduleDailyNotifications() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('No notification permissions');
      return;
    }

    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule breakfast notification (8:00 AM)
    await this.scheduleMealNotification('breakfast', 8, 0);
    
    // Schedule lunch notification (12:00 PM)
    await this.scheduleMealNotification('lunch', 12, 0);
    
    // Schedule dinner notification (6:00 PM)
    await this.scheduleMealNotification('dinner', 18, 0);
  }

  static async scheduleMealNotification(mealType: 'breakfast' | 'lunch' | 'dinner', hour: number, minute: number) {
    const quotes = mealQuotes[mealType];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    // Create a date for today at the specified hour and minute
    const now = new Date();
    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    
    // If the time has already passed today, schedule for tomorrow
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🍽️ ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Time!`,
        body: randomQuote,
        data: { mealType, screen: 'scan' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
      },
      identifier: `daily-${mealType}`,
    });
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  static async toggleNotifications(enabled: boolean) {
    if (enabled) {
      await this.scheduleDailyNotifications();
    } else {
      await this.cancelAllNotifications();
    }
  }

  static async sendTestNotification() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Test Notification',
        body: 'This is a test notification from NutriLytics!',
        data: { screen: 'scan' },
        sound: 'default',
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2 
      },
    });
  }
} 