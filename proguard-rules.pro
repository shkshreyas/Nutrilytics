# Nutrilytics ProGuard Rules

# Keep React Native and Expo
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# React Native Firebase (explicit)
-keep class io.invertase.firebase.** { *; }
-dontwarn io.invertase.firebase.**

# Google Sign-In
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.** { *; }
-keep class com.google.android.gms.tasks.** { *; }

# Keep Gson (used by Firebase and others)
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# Keep Expo modules
-keep class expo.modules.** { *; }
-keep class expo.modules.notifications.** { *; }
-keep class expo.modules.filesystem.** { *; }

# Keep your app's models and important classes
-keep class shk.health.nutrilytics.** { *; }

# General Android rules
-keepattributes SourceFile,LineNumberTable
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Hermes Engine
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep ReactNative Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo Router
-keep class expo.modules.router.** { *; }

# Remove debug logs in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Keep JavaScript callbacks
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
    @com.facebook.react.bridge.ReactProp *;
}

# Preserve native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep important React Native interfaces
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

# Keep the app's entry points
-keepclassmembers class * extends com.facebook.react.bridge.JavaScriptModule {
    @com.facebook.react.bridge.ReactMethod *;
}

# Keep custom exceptions
-keep public class * extends java.lang.Exception

# Keep Crashlytics
-keepattributes SourceFile,LineNumberTable
-keep class com.crashlytics.** { *; }
-dontwarn com.crashlytics.**

# Specific app optimizations
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
