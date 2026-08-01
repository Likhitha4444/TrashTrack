import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute", // Blur effect on iOS
          },
          default: {
            backgroundColor: "#fff", // fallback for Android
            borderTopWidth: 0,
            elevation: 4,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* Dashboard Tab */}
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={26} color={color} />
          ),
        }}
      />

      {/* Upload Tab */}
      <Tabs.Screen
        name="Upload"
        options={{
          title: "Upload",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cloud-upload-outline" size={26} color={color} />
          ),
        }}
      />

      {/* Recycle Result Tab */}
      <Tabs.Screen
        name="RecycleResult"
        options={{
          title: "Result",
          tabBarIcon: ({ color }) => (
            <Ionicons name="checkmark-done-outline" size={26} color={color} />
          ),
        }}
      />
      {/* Donate Tracking Tab */}
      <Tabs.Screen
        name="DonationTracking"
        options={{
          title: "Donate",
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="History"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <Ionicons name="time-outline" size={26} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
