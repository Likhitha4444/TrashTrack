import { router } from "expo-router";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  return (
    <ImageBackground
      source={require("../../assets/images/login.jpg")} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Image
          source={require("../../assets/images/qr.png")}
          style={styles.image}
        />
        <Text style={styles.title}>Trash Track</Text>
        <Text style={styles.subtitle}>
          Upload an image to check if it’s recyclable or not
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.navigate("/Login")}
        >
          <Text style={styles.buttonText}>Let's Start</Text>
          <Ionicons name="arrow-forward" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    marginTop: 100,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#656565ff",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 20,
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745", 
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 30,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginRight: 10,
  },
});
