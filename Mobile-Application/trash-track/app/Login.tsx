import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { baseurl } from "./_layout";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!password || !mobile) {
      Alert.alert("Please fill all fields");
      return;
    }

    try {
      const response = await axios.post(
        baseurl,
        new URLSearchParams({
          tag: "login",
          mobile,
          password,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.data.error === 0) {
          await SecureStore.setItemAsync("mobile", response.data.mobile);
        await SecureStore.setItemAsync("id", String(response.data.id));
        await SecureStore.setItemAsync("username", response.data.username);
        Alert.alert("Login successful");
        router.navigate("/(user)/Dashboard");
        setMobile("");
        setPassword("");
      } else {
        Alert.alert(response.data.message || "Error");
        console.log(response);
      }
    } catch (error: any) {
      Alert.alert(error.message || "Invalid ID/Password");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/login.jpg")} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        {/* Mobile Input */}
        <View style={styles.inputContainer}>
          <FontAwesome name="phone" size={20} color="black" style={styles.icon} />
          <TextInput
            placeholder="Enter Mobile Number"
            value={mobile}
            onChangeText={setMobile}
            style={styles.input}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="black" style={styles.icon} />
          <TextInput
            placeholder="Enter Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <FontAwesome name="sign-in" size={20} color="white" />
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <Text>Don't have an Account?</Text>
        <TouchableOpacity onPress={() => router.navigate("/Registration")}>
          <Text style={styles.textLink}>Create Account</Text>
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
  container: {
    flex: 1,
    backgroundColor: "transparent", 
    marginTop: 100,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 250,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 30,
    marginTop: 20,
    backgroundColor: "#fff",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00ad56",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    margin: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10,
  },
  textLink: {
    color: "#00ad56",
    fontWeight: "bold",
  },
});
