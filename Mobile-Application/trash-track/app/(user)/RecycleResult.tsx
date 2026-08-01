import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TextInput,
  Easing,
  Image,
  RefreshControl,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { baseurl } from "../_layout";
import Header from "../Header";
import { router } from "expo-router";

// Gemini API Configuration
const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const RecycleResult: React.FC = () => {
  const [status, setStatus] = useState<string>("Processing");
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState<string>("Fetching guide…");
  const [nearestCenters, setNearestCenters] = useState<any[]>([]);
  const [donationDescription, setDonationDescription] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [guideImage, setGuideImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [itemName, setItemName] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [userMobile, setUserMobile] = useState<string>("");
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [donations, setDonations] = useState<any[]>([]);

  const rotation = useRef(new Animated.Value(0)).current;

  // Spinner animation
  useEffect(() => {
    if (!loading) return;
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [loading]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Load user data from secure store
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedId = await SecureStore.getItemAsync("id");
        const storedMobile = await SecureStore.getItemAsync("mobile");
        const storedUsername = await SecureStore.getItemAsync("username");
        
        setUserId(storedId);
        setUserMobile(storedMobile || "");
        
        // Get user address from location
        const location = await getUserLocation();
        if (location) {
          const address = await getAddressFromCoords(location.latitude, location.longitude);
          setUserAddress(address);
        }
      } catch (e) {
        console.error("Error fetching user:", e);
      }
    };
    loadUser();
  }, []);

  // Get user location and address
  const getUserLocation = async () => {
    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to find nearest centers.");
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const location = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };
      setUserLocation(location);
      return location;
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get your location.");
      return null;
    }
  };

  // Reverse geocoding to get address
  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (address.length > 0) {
        const addr = address[0];
        return `${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.postalCode || ''}`.trim();
      }
      return "Address not available";
    } catch (error) {
      console.error("Error getting address:", error);
      return "Address not available";
    }
  };

  // Function to open Google Maps navigation
  const openGoogleMapsNavigation = (centerLat: number, centerLng: number, centerName: string) => {
    if (!userLocation) {
      Alert.alert("Error", "Your location is not available.");
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${centerLat},${centerLng}&travelmode=driving&dir_action=navigate`;
    
    Linking.openURL(url).catch(err => {
      console.error("Error opening Google Maps:", err);
      Alert.alert("Error", "Could not open Google Maps. Please make sure it's installed.");
    });
  };

  const fetchRecycleGuide = async (itemName: string) => {
    // CRITICAL CHECK: Ensure itemName is valid
    if (!itemName || itemName.trim() === "") {
        setGuide("Error: Item name is missing or invalid.");
        console.error("Gemini Recycling Error: Item name is not defined.");
        return; 
    }

    try {
        setGuide("Generating recycling guide…");
        const response = await axios.post(
            GEMINI_URL,
            {
                contents: [
                    {
                        parts: [
                            {
                                // Using the simple, robust prompt
                                text: `Provide clear, step-by-step instructions for recycling the item: "${itemName}". Focus only on the practical steps.`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 4098, 
                    topP: 0.9,
                    topK: 40,
                },
            },
            {
                headers: { "Content-Type": "application/json" },
                timeout: 15000,
            }
        );

        // --- NEW & IMPROVED RESPONSE HANDLING ---
        const candidates = response.data?.candidates;
        
        if (candidates && candidates.length > 0) {
            const candidate = candidates[0];
            const text = candidate?.content?.parts?.[0]?.text?.trim();
            
            // 1. Check for **Safety Filter** or **Block Reason**
            if (candidate?.finishReason === 'SAFETY' || candidate?.safetyRatings) {
                const blockReason = candidate?.safetyRatings?.[0]?.blockReason || 'SAFETY_BLOCKED';
                console.warn(`Gemini Blocked: Response blocked by safety filter. Reason: ${blockReason}`);
                setGuide("⚠️ The guide could not be generated due to content safety policy. Try a simpler item name.");
                return;
            }
            
            // 2. Check for **Empty Text** after successful processing
            if (text) {
                console.log("Gemini Recycling Response:", text.substring(0, 100) + '...'); // Log first 100 chars
                setGuide(text);
            } else {
                // This covers cases where text is null/empty/undefined without a block reason
                console.error("Gemini Failure: Text is empty after successful API call.", JSON.stringify(response.data.candidates));
                setGuide("No recycling instructions could be generated for this item.");
            }
            
        } else {
            // General failure (e.g., API key issue, model not supported, or unexpected empty response)
            console.error("Gemini Failure: Candidates array is missing or empty.", JSON.stringify(response.data));
            setGuide("No recycling instructions available for this item.");
        }

    } catch (error: any) {
        // Handle network errors, 400/500 HTTP errors
        const errorMessage = error.response?.data?.error?.message || error.message;
        console.error("Gemini Recycling Error:", errorMessage);
        setGuide(`⚠️ Recycling guide unavailable. Error: ${errorMessage.substring(0, 50)}...`);
    }
};

  // ✅ FETCH REUSE GUIDE — Using Gemini AI
  const fetchReusableGuide = async (itemName: string) => {
    try {
      setGuide("Generating creative reuse ideas…");
      const response = await axios.post(
        GEMINI_URL,
        {
          contents: [
            {
              parts: [
                {
                  text: `Provide creative reuse and repurposing ideas for "${itemName}". Include:
                  1. DIY project ideas with difficulty levels
                  2. Practical household uses
                  3. Creative upcycling suggestions
                  4. Step-by-step instructions for 2-3 best ideas
                  5. Tools and materials needed
                  6. Estimated time and cost
                  
                  Make it inspiring and practical. Under 500 words. No images.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
            topP: 0.9,
            topK: 40,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      setGuide(text || "No reuse ideas available for this item.");
    } catch (error: any) {
      console.error("Gemini Reuse Error:", error.response?.data || error.message);
      setGuide("⚠️ Reuse guide unavailable. Please check your connection and try again.");
    }
  };

  // Fetch upload status from backend
  const fetchStatusOnce = async () => {
    if (!userId) return;
    if (!refreshing) setLoading(true);

    try {
      const response = await axios.post(
        baseurl,
        new URLSearchParams({ tag: "get_upload_status", userid: userId }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const result = typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data;

      if (result.error === 0 && result.item_name) {
        setStatus(result.status);
        setItemName(result.item_name);
        if (result.image) setGuideImage(result.image);

        if (["Recyclable", "Reusable", "Non-Recyclable"].includes(result.status)) {
          if (result.status === "Recyclable" || result.status === "Non-Recyclable") {
            fetchRecycleGuide(result.item_name);
            fetchNearestCenters("recyclable");
          } else if (result.status === "Reusable") {
            fetchReusableGuide(result.item_name);
            // For reusable items, fetch available donations
            fetchAvailableDonations();
          }
        }
        setLoading(false);
      } else {
        setTimeout(fetchStatusOnce, 3000);
      }
    } catch (error) {
      console.error("Status fetch error:", error);
      setTimeout(fetchStatusOnce, 5000);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) fetchStatusOnce();
  }, [userId]);

  // Fetch nearest centers based on type
  const fetchNearestCenters = async (type: string) => {
    try {
      const location = await getUserLocation();
      if (!location) return;

     
      const res = await axios.post(
        baseurl,
        new URLSearchParams({
          tag: "get_nearest_centers",
          latitude: String(location.latitude),
          longitude: String(location.longitude),
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      setNearestCenters(res.data.centers || []);
    } catch (err) {
      console.error("Centers fetch error:", err);
      Alert.alert("Error", "Failed to fetch nearby centers.");
    }
  };

  // Fetch available donations for receivers
  const fetchAvailableDonations = async () => {
    try {
      const res = await axios.post(
        baseurl,
        new URLSearchParams({
          tag: "get_available_donations",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      if (res.data.error === 0) {
        setDonations(res.data.donations || []);
      }
    } catch (err) {
      console.error("Donations fetch error:", err);
    }
  };

  // Handle donation submission
  const handleDonate = async () => {
    if (!donationDescription.trim()) {
      Alert.alert("Missing Description", "Please describe the item you want to donate.");
      return;
    }
    if (!userId) return;

    try {
      const res = await axios.post(
        baseurl,
        new URLSearchParams({
          tag: "donate_item",
          userid: userId,
          description: donationDescription,
          address: userAddress,
          mobile: userMobile,
          item_name: itemName,
          image: guideImage || "",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      
      if (res.data.error === 0) {
        Alert.alert("Success", "Item flagged for donation! Others can now see your donation offer.");
        setDonationDescription("");
        setDonateModalVisible(false);
        router.replace("/(user)/DonateTracking")
      } else {
        Alert.alert("Error", res.data.message || "Donation failed. Please try again.");
      }
    } catch (err) {
      console.error("Donation error:", err);
      Alert.alert("Error", "Failed to submit donation. Please check your connection.");
    }
  };

  // Handle receiving an item
  const handleReceiveItem = async (donationId: string) => {
    if (!userId) return;

    try {
      const res = await axios.post(
        baseurl,
        new URLSearchParams({
          tag: "receive_item",
          userid: userId,
          donation_id: donationId,
          receiver_mobile: userMobile,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      
      if (res.data.error === 0) {
        Alert.alert("Success", "Item received! Contact the donor to arrange pickup.");
        setReceiveModalVisible(false);
        fetchAvailableDonations(); // Refresh donations list
      } else {
        Alert.alert("Error", res.data.message || "Failed to receive item.");
      }
    } catch (err) {
      console.error("Receive error:", err);
      Alert.alert("Error", "Failed to process receipt.");
    }
  };

  // Contact donor via phone
  const contactDonor = (mobile: string) => {
    Linking.openURL(`tel:${mobile}`).catch(err => {
      Alert.alert("Error", "Could not make phone call.");
    });
  };

  // UI Render
  if (!userId || loading) {
    return (
      <>
        <Header />
        <View style={styles.center}>
          <Animated.Text
            style={{ fontSize: 50, transform: [{ rotate: rotateInterpolate }] }}
          >
            ♻
          </Animated.Text>
          <Text style={{ marginTop: 10, textAlign: "center" }}>
            Analyzing your item… Please wait
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStatusOnce();
            }}
            tintColor="#0077b6"
            colors={["#0077b6"]}
          />
        }
      >
        <Text style={styles.title}>♻ Recycling Analysis Result</Text>
        
        <View style={styles.resultContainer}>
          {(status === "Recyclable" || status === "Non-Recyclable") && (
            <>
              <MaterialIcons name="check-circle" size={80} color="#28a745" />
              <Text style={styles.statusText}>✅ {status}</Text>
              <Text style={styles.itemName}>Item: {itemName}</Text>
              
              <Text style={styles.sectionTitle}>♻ Recycling Guide</Text>
              {guideImage && (
                <Image
                  source={{ uri: guideImage }}
                  style={styles.itemImage}
                />
              )}
              <Text style={styles.guideText}>{guide}</Text>
              
              <Text style={styles.sectionTitle}>🏢 Nearest Trash Centers</Text>
              {nearestCenters.length > 0 ? (
                nearestCenters.map((center, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.centerCard}
                    onPress={() => openGoogleMapsNavigation(
                      parseFloat(center.latitude), 
                      parseFloat(center.longitude),
                      center.name
                    )}
                  >
                    <View style={styles.centerInfo}>
                      <Text style={styles.centerName}>{center.name}</Text>
                      <Text style={styles.centerDistance}>
                        📍 {parseFloat(center.distance).toFixed(2)} km away
                      </Text>
                      {center.mobile && (
                        <Text style={styles.centerMobile}>📞 {center.mobile}</Text>
                      )}
                    </View>
                    <MaterialIcons name="directions" size={24} color="#0077b6" />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noCentersText}>No recycling centers found nearby.</Text>
              )}

              <TouchableOpacity 
                style={styles.donateOptionButton}
                onPress={() => setDonateModalVisible(true)}
              >
                <Text style={styles.donateOptionText}>🎁 Want to Donate Instead?</Text>
              </TouchableOpacity>
            </>
          )}

          {status === "Reusable" && (
            <>
              <MaterialIcons name="recycling" size={80} color="#ffc107" />
              <Text style={styles.statusText}>🔄 {status}</Text>
              <Text style={styles.itemName}>Item: {itemName}</Text>
              
              <Text style={styles.sectionTitle}>💡 Creative Reuse Ideas</Text>
              {guideImage && (
                <Image
                  source={{ uri: guideImage }}
                  style={styles.itemImage}
                />
              )}
              <Text style={styles.guideText}>{guide}</Text>

              <View style={styles.reusableOptions}>
                <TouchableOpacity 
                  style={styles.donateButton}
                  onPress={() => setDonateModalVisible(true)}
                >
                  <MaterialIcons name="card-giftcard" size={20} color="#fff" />
                  <Text style={styles.donateButtonText}>Donate Item</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.receiveButton}
                  onPress={() => setReceiveModalVisible(true)}
                >
                  <MaterialIcons name="inventory" size={20} color="#222" />
                  <Text style={styles.receiveButtonText}>Browse Donations</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Donation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={donateModalVisible}
        onRequestClose={() => setDonateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎁 Donate Item</Text>
            
            <Text style={styles.modalLabel}>Item to Donate:</Text>
            <Text style={styles.itemDisplay}>{itemName}</Text>

            {guideImage && (
              <Image source={{ uri: guideImage }} style={styles.modalImage} />
            )}

            <Text style={styles.modalLabel}>Description:</Text>
            <TextInput
              placeholder="Describe condition, size, any damages, etc."
              value={donationDescription}
              onChangeText={setDonationDescription}
              style={styles.modalInput}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.modalLabel}>Your Contact Info:</Text>
            <Text style={styles.contactInfo}>📞 {userMobile}</Text>
            <Text style={styles.contactInfo}>📍 {userAddress}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setDonateModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleDonate}
              >
                <Text style={styles.confirmButtonText}>Confirm Donation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receive Items Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={receiveModalVisible}
        onRequestClose={() => setReceiveModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📦 Available Donations</Text>
            
            <ScrollView style={styles.donationsList}>
              {donations.length > 0 ? (
                donations.map((donation) => (
                  <View key={donation.id} style={styles.donationCard}>
                    {donation.image && (
                      <Image source={{ uri: donation.image }} style={styles.donationImage} />
                    )}
                    <View style={styles.donationInfo}>
                      <Text style={styles.donationItem}>{donation.item_name}</Text>
                      <Text style={styles.donationDesc}>{donation.description}</Text>
                      <Text style={styles.donorInfo}>From: {donation.username}</Text>
                      <Text style={styles.donorContact}>📞 {donation.mobile}</Text>
                      <Text style={styles.donorAddress}>📍 {donation.address}</Text>
                      
                      <View style={styles.donationActions}>
                        <TouchableOpacity 
                          style={styles.contactButton}
                          onPress={() => contactDonor(donation.mobile)}
                        >
                          <Text style={styles.contactButtonText}>Call Donor</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.receiveItemButton}
                          onPress={() => handleReceiveItem(donation.id)}
                        >
                          <Text style={styles.receiveItemText}>I'll Take It</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDonationsText}>No donations available at the moment.</Text>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setReceiveModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 20, 
    backgroundColor: "#f9f9f9" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "700", 
    marginBottom: 25, 
    textAlign: "center",
    color: "#0077b6"
  },
  resultContainer: {
    alignItems: "center",
    width: "100%",
  },
  statusText: { 
    fontSize: 20, 
    fontWeight: "600", 
    marginTop: 15, 
    textAlign: "center",
    color: "#333"
  },
  itemName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginTop: 25,
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
    width: "100%",
  },
  guideText: { 
    fontSize: 16, 
    marginTop: 12, 
    textAlign: "left", 
    lineHeight: 24,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "100%",
  },
  itemImage: {
    width: 200, 
    height: 200, 
    borderRadius: 10, 
    marginVertical: 10,
    alignSelf: "center",
  },
  centerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  centerDistance: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  centerMobile: {
    fontSize: 14,
    color: "#0077b6",
  },
  noCentersText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: 20,
  },
  reusableOptions: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
    gap: 5,
  },
  donateButton: {
    flex: 1,
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  donateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  receiveButton: {
    flex: 1,
    backgroundColor: "#ffc107",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  receiveButtonText: {
    color: "#222",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  donateOptionButton: {
    backgroundColor: "#6f42c1",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  donateOptionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 5,
    color: "#333",
  },
  itemDisplay: {
    fontSize: 16,
    color: "#0077b6",
    fontWeight: "600",
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  modalImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    alignSelf: "center",
    marginVertical: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
  },
  contactInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  
  // Donations List Styles
  donationsList: {
    maxHeight: 400,
  },
  donationCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flexDirection: "row",
  },
  donationImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  donationInfo: {
    flex: 1,
  },
  donationItem: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  donationDesc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  donorInfo: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  donorContact: {
    fontSize: 12,
    color: "#0077b6",
    marginBottom: 2,
  },
  donorAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  donationActions: {
    flexDirection: "row",
    gap: 10,
  },
  contactButton: {
    backgroundColor: "#17a2b8",
    padding: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  receiveItemButton: {
    backgroundColor: "#28a745",
    padding: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  receiveItemText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  noDonationsText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default RecycleResult;