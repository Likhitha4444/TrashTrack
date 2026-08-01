import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Header from "../Header";
import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import { baseurl } from "../_layout";
import * as SecureStore from "expo-secure-store";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const Upload: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedId = await SecureStore.getItemAsync("id");
        setUserId(storedId);
      } catch (e) {
        console.error("Error fetching user:", e);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission to access gallery is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const captureImage = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission to access camera is required!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!image) {
      Alert.alert("Please upload or capture an image.");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "No user ID found. Please log in again.");
      return;
    }

    try {
      setUploading(true);

      const base64 = await FileSystem.readAsStringAsync(image, {
        encoding: "base64",
      });
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      const response = await axios.post(
        baseurl,
        new URLSearchParams({
          tag: "uploadimage",
          image: dataUrl,
          userid: userId,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      if (response.data.error === 0) {
        setStatusMessage("Uploaded successfully!");
        setImage(null);
        router.push("/RecycleResult"); // make sure this route exists
      } else {
        Alert.alert("Error", response.data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error submitting image:", error);
      Alert.alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  if (loadingUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.innerContainer}>
        <Text style={styles.title}>
          ♻ Upload for Recycling Check
        </Text>

        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons name="photo-camera" size={50} color="#aaa" />
            <Text style={styles.placeholderText}>No image selected yet</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <MaterialIcons name="photo-library" size={20} color="white" />
            <Text style={styles.imageButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.imageButton} onPress={captureImage}>
            <MaterialIcons name="camera-alt" size={20} color="white" />
            <Text style={styles.imageButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, uploading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Upload</Text>
          )}
        </TouchableOpacity>

        {statusMessage !== "" && (
          <Text style={styles.statusMessage}>{statusMessage}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  innerContainer: { padding: 25 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
    color: "#2e2e2e",
  },
  placeholder: {
    height: 200,
    borderWidth: 2,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  placeholderText: { marginTop: 8, color: "#999", fontSize: 14 },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
    resizeMode: "cover",
  },
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0077b6",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 30,
    flex: 1,
    marginHorizontal: 5,
  },
  imageButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#28a745",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  statusMessage: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: "600",
    color: "#28A745",
    textAlign: "center",
  },
});

export default Upload;
