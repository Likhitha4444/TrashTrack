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
import { baseurl } from "./_layout";
import axios from "axios";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";

export default function Registration() {
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegistration = async () => {
    if (!username || !mobile || !email || !password) {
      Alert.alert("Error", "Please fill all the fields");
      return;
    }

    if (mobile.length !== 10) {
      Alert.alert("Error", "Mobile number should be 10 digits");
      return;
    }

    try {
      const response = await axios.post(
        baseurl,
        new URLSearchParams({
          tag: "register",
          username,
          mobile,
          email,
          password,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      if (response.data.error === 0) {
        Alert.alert("Success", response.data.message || "Registration successful.");
        router.navigate("/Login");
      } else {
        Alert.alert("Error", response.data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Error", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/login.jpg")} // use your local bg image
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Registration</Text>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={20} color="black" style={styles.icon} />
          <TextInput
            placeholder="Enter Name"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
        </View>

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

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color="black" style={styles.icon} />
          <TextInput
            placeholder="Enter Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="black" style={styles.icon} />
          <TextInput
            placeholder="Create Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity style={styles.button} onPress={handleRegistration}>
          <FontAwesome name="check" size={20} color="white" />
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>

        <Text>Already have an Account?</Text>
        <TouchableOpacity onPress={() => router.navigate("/Login")}>
          <Text style={styles.textLink}>Login</Text>
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
    marginTop: 80,
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
    width: 280,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 30,
    marginTop: 15,
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
