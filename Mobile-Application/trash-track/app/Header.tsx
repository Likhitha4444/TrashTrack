// Header.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

const Header: React.FC = () => {
  const router = useRouter();

  function onLogout() {
    router.replace("/Login");
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.homeContainer}>
        <TouchableOpacity style={styles.homeButton}>
          {/* Recycling / Trash Icon */}
          <MaterialCommunityIcons name="recycle" size={28} color="#fff" />
          <View>
            <Text style={styles.title}>Trash Track</Text>
            <Text style={styles.subtitle}>Smart Waste Management</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.logOutContainer}>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 100,
    backgroundColor: "#2E7D32", // Green for eco-friendly
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1B5E20",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  homeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 12,
    color: "#dcedc8",
    marginLeft: 8,
  },
  logOutContainer: {
    paddingTop: 10,
  },
  logoutButton: {
    backgroundColor: "#c32420",
    padding: 8,
    borderRadius: 20,
  },
});

export default Header;
