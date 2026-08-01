import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { baseurl } from "../_layout";
import Header from "../Header";

interface Donation {
  id: string;
  item_name: string;
  description: string;
  image: string;
  status: "Available" | "Received" | "Pending" | "Cancelled";
  created_at: string;
  receiver_name?: string;
  receiver_mobile?: string;
  received_at?: string;
  address: string;
  mobile: string;
  username: string;
  coins: number;
}

const DonationTracking: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my" | "available">("my");
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedId = await SecureStore.getItemAsync("id");
        setUserId(storedId);
      } catch (e) {
        console.error("Error fetching user:", e);
      }
    };
    loadUser();
  }, []);

  // Fetch donations based on active tab
  const fetchDonations = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      let response;
      if (activeTab === "my") {
        // Fetch user's own donations
        response = await axios.post(
          baseurl,
          new URLSearchParams({
            tag: "get_user_donations",
            userid: userId,
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
      } else {
        // Fetch all available donations
        response = await axios.post(
          baseurl,
          new URLSearchParams({
            tag: "get_available_donations",
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
      }

      if (response.data.error === 0) {
        setDonations(response.data.donations || []);
      } else {
        Alert.alert("Error", "Failed to fetch donations");
      }
    } catch (error) {
      console.error("Donation fetch error:", error);
      Alert.alert("Error", "Failed to load donations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDonations();
    }
  }, [userId, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDonations();
  };

  const handleReceiveItem = async (donationId: string) => {
    if (!userId) return;

    try {
      const userMobile = await SecureStore.getItemAsync("mobile");
      
      const response = await axios.post(
        baseurl,
        new URLSearchParams({
          tag: "receive_item",
          userid: userId,
          donation_id: donationId,
          receiver_mobile: userMobile || "",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.error === 0) {
        Alert.alert("Success", "Item received successfully!");
        fetchDonations(); // Refresh the list
      } else {
        Alert.alert("Error", response.data.message || "Failed to receive item");
      }
    } catch (error) {
      console.error("Receive error:", error);
      Alert.alert("Error", "Failed to process receipt");
    }
  };

  const updateDonationStatus = async (donationId: string, status: string) => {
    try {
      const response = await axios.post(
        baseurl,
        new URLSearchParams({
          tag: "update_donation_status",
          donation_id: donationId,
          status: status,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.error === 0) {
        Alert.alert("Success", "Status updated successfully!");
        setStatusModalVisible(false);
        setSelectedDonation(null);
        fetchDonations(); // Refresh the list
      } else {
        Alert.alert("Error", response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      Alert.alert("Error", "Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "#28a745";
      case "Received":
        return "#0077b6";
      case "Pending":
        return "#ffc107";
      case "Cancelled":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Available":
        return "check-circle";
      case "Received":
        return "inventory";
      case "Pending":
        return "schedule";
      case "Cancelled":
        return "cancel";
      default:
        return "help";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const DonationCard = ({ donation, showActions = true }: { donation: Donation; showActions?: boolean }) => (
    <View style={styles.donationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>{donation.item_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(donation.status) }]}>
          <MaterialIcons name={getStatusIcon(donation.status)} size={14} color="#fff" />
          <Text style={styles.statusText}>{donation.status}</Text>
        </View>
      </View>

      {donation.image && (
        <Image source={{ uri: donation.image }} style={styles.donationImage} />
      )}

      <Text style={styles.description}>{donation.description}</Text>

      <View style={styles.donorInfo}>
        <Text style={styles.infoText}>👤 {donation.username}</Text>
        <Text style={styles.infoText}>📞 {donation.mobile}</Text>
        <Text style={styles.infoText}>📍 {donation.address}</Text>
        <Text style={styles.infoText}>📅 {formatDate(donation.created_at)}</Text>
      </View>
      {donation.coins > 0 && (
        <View style={styles.donorInfo}>
          <Text style={styles.infoText}>💰 Coins Earned: {donation.coins}</Text>
        </View>
      )}
      {donation.status === "Received" && donation.receiver_name && (
        <View style={styles.receiverInfo}>
          <Text style={styles.receivedText}>Received by: {donation.receiver_name}</Text>
          <Text style={styles.receivedText}>Contact: {donation.receiver_mobile}</Text>
          {donation.received_at && (
            <Text style={styles.receivedText}>On: {formatDate(donation.received_at)}</Text>
          )}
          
        </View>

      )}

      {showActions && (
        <View style={styles.actionButtons}>
          {activeTab === "my" ? (
            // My Donations - Can update status
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => {
                setSelectedDonation(donation);
                setNewStatus(donation.status);
                setStatusModalVisible(true);
              }}
            >
              <Text style={styles.updateButtonText}>Update Status</Text>
            </TouchableOpacity>
          ) : (
            // Available Donations - Can receive
            donation.status === "Available" && (
              <TouchableOpacity
                style={styles.receiveButton}
                onPress={() => handleReceiveItem(donation.id)}
              >
                <Text style={styles.receiveButtonText}>Receive Item</Text>
              </TouchableOpacity>
            )
          )}

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              setSelectedDonation(donation);
              setModalVisible(true);
            }}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && donations.length === 0) {
    return (
      <>
        <Header />
        <View style={styles.center}>
          <Text>Loading donations...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header />
      <View style={styles.container}>
        <Text style={styles.title}>🎁 Donation Tracking</Text>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "my" && styles.activeTab]}
            onPress={() => setActiveTab("my")}
          >
            <Text style={[styles.tabText, activeTab === "my" && styles.activeTabText]}>
              My Donations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "available" && styles.activeTab]}
            onPress={() => setActiveTab("available")}
          >
            <Text style={[styles.tabText, activeTab === "available" && styles.activeTabText]}>
              Available Donations
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0077b6"
              colors={["#0077b6"]}
            />
          }
        >
          {donations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={60} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {activeTab === "my" 
                  ? "You haven't made any donations yet." 
                  : "No donations available at the moment."}
              </Text>
            </View>
          ) : (
            donations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))
          )}
        </ScrollView>

        {/* Donation Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedDonation && (
                <>
                  <Text style={styles.modalTitle}>Donation Details</Text>
                  <DonationCard donation={selectedDonation} showActions={false} />
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeModalText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Status Update Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={statusModalVisible}
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Donation Status</Text>
              
              <Text style={styles.modalLabel}>Current Item:</Text>
              <Text style={styles.itemDisplay}>{selectedDonation?.item_name}</Text>

              <Text style={styles.modalLabel}>New Status:</Text>
              <View style={styles.statusOptions}>
                {["Available", "Pending", "Cancelled"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      newStatus === status && styles.selectedStatusOption,
                      { backgroundColor: getStatusColor(status) }
                    ]}
                    onPress={() => setNewStatus(status)}
                  >
                    <Text style={styles.statusOptionText}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setStatusModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => selectedDonation && updateDonationStatus(selectedDonation.id, newStatus)}
                >
                  <Text style={styles.confirmButtonText}>Update Status</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 20,
    color: "#0077b6",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "#e9ecef",
    borderRadius: 10,
    padding: 4,
  },
  coinsText: {
  fontSize: 16,
  color: "#2E7D32",
  fontWeight: "600",
  marginTop: 5,
},

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#0077b6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c757d",
  },
  activeTabText: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  donationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  donationImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  donorInfo: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 4,
  },
  receiverInfo: {
    backgroundColor: "#e7f3ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0077b6",
  },
  receivedText: {
    fontSize: 12,
    color: "#0077b6",
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  receiveButton: {
    flex: 1,
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  receiveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  updateButton: {
    flex: 1,
    backgroundColor: "#ffc107",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  statusOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  statusOption: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    opacity: 0.7,
  },
  selectedStatusOption: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  statusOptionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
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
    backgroundColor: "#0077b6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  closeModalButton: {
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  closeModalText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default DonationTracking;