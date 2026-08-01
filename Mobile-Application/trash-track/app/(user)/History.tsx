import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import { baseurl } from "../_layout";
import Header from "../Header";

export default function UploadHistory() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const userId = await SecureStore.getItemAsync("id");
        if (!userId) {
          alert("User not found");
          setLoading(false);
          return;
        }

        const response = await fetch(baseurl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            tag: "get_user_uploads",
            userid: userId,
          }).toString(),
        });

        const data = await response.json();
        if (!data.error) {
          setUploads(data.uploads);
        } else {
          alert(data.message || "Failed to fetch uploads");
        }
      } catch (error) {
        console.error("Error fetching uploads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, []);

  const renderItem = ({ item } : {item:any}) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: item.image?.startsWith("data:image")
            ? item.image
            : `${baseurl.replace("api.php", "")}${item.image}`,
        }}
        style={styles.image}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Text
          style={[
            styles.status,
            {
              color:
                item.status === "Recyclable"
                  ? "#2E7D32"
                  : item.status === "Reusable"
                  ? "#0288D1"
                  : item.status === "Non-Recyclable"
                  ? "#C62828"
                  : "#FFB300",
            },
          ]}
        >
          {item.status}
        </Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text>Loading uploads...</Text>
      </View>
    );
  }

  return (
    <>
      <Header />
      <View style={styles.container}>
        <Text style={styles.title}>My Upload History</Text>

        {uploads.length > 0 ? (
          <FlatList
            data={uploads}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        ) : (
          <Text style={styles.emptyText}>No uploads found.</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 10,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 6,
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
  },
  infoContainer: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
    marginVertical: 4,
  },
  date: {
    fontSize: 12,
    color: "#757575",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#757575",
    fontSize: 16,
    marginTop: 40,
  },
});
