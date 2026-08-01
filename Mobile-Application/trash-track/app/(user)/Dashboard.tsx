import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "../Header";
import { baseurl } from "../_layout";


export default function Dashboard() {
  const [username, setUsername] = useState<string | null>(null);
  const [userid, setUserid] = useState<string | null>(null);
  const [totalCoins, setTotalCoins] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedName = await SecureStore.getItemAsync("username");
        const storedId = await SecureStore.getItemAsync("id"); 
        setUsername(storedName);
        setUserid(storedId);

        if (storedId) {
          fetchTotalCoins(storedId);
        }
      } catch (e) {
        console.error("Error fetching user from SecureStore:", e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const fetchTotalCoins = async (id: string) => {
    try {
      const response = await axios.post(
        baseurl,
        new URLSearchParams({
          tag: "get_user_total_coins",
          userid: id,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.error === 0) {
        setTotalCoins(response.data.total_coins || 0);
      } else {
        console.warn("Error fetching coins:", response.data.message);
      }
    } catch (err) {
      console.error("Error loading coins:", err);
    }
  };

  return (
    <>
      <Header />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : username ? (
        <View style={styles.userContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.username}>Welcome {username || "User"}</Text>
            <Text style={styles.coinsText}>💰 Coins Earned: {totalCoins}</Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="upload" size={26} color="#2E7D32" />
              <Text style={styles.featureText}>Upload waste image</Text>
            </View>

            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="recycle" size={26} color="#2E7D32" />
              <Text style={styles.featureText}>
                Recyclable → Get recycling suggestions
              </Text>
            </View>

            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="delete" size={26} color="#c32420" />
              <Text style={styles.featureText}>
                Non-recyclable → Nearest trash location
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => router.navigate("/(user)/Upload")}
          >
            <MaterialCommunityIcons name="upload" size={26} color="white" />
            <Text style={styles.uploadButtonText}>Upload Waste Image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={50}
            color="#e63946"
          />
          <Text style={styles.errorText}>No user data found.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  userContainer: { alignItems: "center", padding: 25, marginTop: 80 },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  username: { fontSize: 24, fontWeight: "bold", color: "#1B5E20" },
  coinsText: { fontSize: 18, color: "#2E7D32", marginTop: 18, fontWeight: "800" },
  featuresContainer: { width: "100%", marginBottom: 30 },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featureText: { fontSize: 16, color: "#212529", marginLeft: 15 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 18, color: "#e63946", marginTop: 15, textAlign: "center" },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
});
