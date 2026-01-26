import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { workCategories } from "../src/store/WorkData";

const PostNewWorkScreen = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Location State
  const [locationMode, setLocationMode] = useState("current");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // --- NEW LOGOUT FUNCTION ---
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("userToken");
            // Use replace to prevent going back to this screen
            router.replace("src/screens/LoginScreen");
          } catch (e) {
            console.error("Logout failed", e);
          }
        },
      },
    ]);
  };

  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        setIsLocating(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setCoordinates({ latitude, longitude });

      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const formattedAddress = `${addr.name || ""} ${addr.street || ""}, ${addr.city}, ${addr.region}`;
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not fetch location. Please enter manually.");
    } finally {
      setIsLocating(false);
    }
  };

  const handlePostWork = async () => {
    if (!jobTitle || !amount || !category) {
      Alert.alert("Error", "Please fill in Job Title, Category, and Budget.");
      return;
    }

    setLoading(true);

    try {
      let finalLat = coordinates?.latitude;
      let finalLng = coordinates?.longitude;

      if (locationMode === "manual") {
        if (!address) {
          Alert.alert("Error", "Please enter an address.");
          setLoading(false);
          return;
        }

        try {
          const geocodedLocation = await Location.geocodeAsync(address);
          if (geocodedLocation.length > 0) {
            finalLat = geocodedLocation[0].latitude;
            finalLng = geocodedLocation[0].longitude;
          } else {
            console.warn("Could not geocode address");
          }
        } catch (e) {
          console.error("Geocoding failed", e);
        }
      } else {
        if (!finalLat || !finalLng) {
          Alert.alert(
            "Error",
            "Please click 'Detect Location' or enter address manually.",
          );
          setLoading(false);
          return;
        }
      }

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Session expired. Please login again.");
        return;
      }

      const decoded = jwtDecode(token);
      const employerId = decoded.id;

      const payload = {
        title: jobTitle,
        description: `Duration: ${duration}. Category: ${category}. Contact: ${mobileNumber}`,
        skillsRequired: category,
        earning: parseFloat(amount),
        location: address || "Pune, Maharashtra",
        latitude: finalLat,
        longitude: finalLng,
        image: "https://example.com/images/default-work.jpg",
        employerId: employerId,
      };

      const API_URL = "http://10.62.29.175:8080/employer/post-work";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Success", "Work posted successfully!", [
          {
            text: "OK",
            onPress: () => {
              setJobTitle("");
              setAmount("");
              setDuration("");
              setMobileNumber("");
              setCategory("");
              setAddress("");
              setCoordinates(null);
              router.replace("/(employer)/YouPostedScreen");
            },
          },
        ]);
      } else {
        const errorData = await response.text();
        Alert.alert("Failed", errorData || "Failed to post work.");
      }
    } catch (error) {
      console.error("Post Error:", error);
      Alert.alert("Network Error", "Check your server connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (selectedLabel) => {
    setCategory(selectedLabel);
    setModalVisible(false);
  };

  const renderCategoryModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={workCategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => handleSelectCategory(item.label)}
              >
                <View
                  style={[styles.colorDot, { backgroundColor: item.color }]}
                />
                <Text style={styles.categoryItemText}>{item.label}</Text>
                {category === item.label && (
                  <MaterialIcons name="check" size={20} color="#0D47A1" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {renderCategoryModal()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- UPDATED HEADER --- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Post New Work</Text>
            <Text style={styles.headerSubtitle}>Hire Skill in Seconds</Text>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* ---------------------- */}

        <View style={styles.formBody}>
          {/* ... All Form Inputs (Title, Category, etc.) ... */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>JOB TITLE</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="work"
                size={20}
                color="#0D47A1"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g Need help with wall painting"
                value={jobTitle}
                onChangeText={setJobTitle}
              />
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>CATEGORY</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setModalVisible(true)}
              >
                <MaterialIcons
                  name="category"
                  size={20}
                  color="#0D47A1"
                  style={styles.inputIcon}
                />
                <Text
                  style={[styles.dropdownText, !category && { color: "#999" }]}
                  numberOfLines={1}
                >
                  {category || "Select"}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={20}
                  color="#0D47A1"
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>DURATION</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color="#0D47A1"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 6 hrs"
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>WORK LOCATION</Text>
            <View style={styles.locationToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  locationMode === "current" && styles.toggleActive,
                ]}
                onPress={() => setLocationMode("current")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    locationMode === "current" && styles.toggleTextActive,
                  ]}
                >
                  Current Location
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  locationMode === "manual" && styles.toggleActive,
                ]}
                onPress={() => setLocationMode("manual")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    locationMode === "manual" && styles.toggleTextActive,
                  ]}
                >
                  Enter Address
                </Text>
              </TouchableOpacity>
            </View>

            {locationMode === "current" ? (
              <View style={styles.locationBox}>
                <TouchableOpacity
                  style={styles.detectButton}
                  onPress={handleGetCurrentLocation}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <MaterialIcons name="my-location" size={20} color="#fff" />
                  )}
                  <Text style={styles.detectButtonText}>
                    {isLocating ? "Detecting..." : "Detect My Location"}
                  </Text>
                </TouchableOpacity>
                {address ? (
                  <Text style={styles.detectedAddress}>
                    <MaterialIcons name="place" size={16} color="green" />{" "}
                    {address}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="edit-location"
                  size={20}
                  color="#0D47A1"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Flat 101, Main Road, Pune"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>BUDGET AMOUNT</Text>
            <View style={styles.amountContainer}>
              <FontAwesome5
                name="rupee-sign"
                size={18}
                color="#FFC107"
                style={styles.rupeeIcon}
              />
              <TextInput
                style={styles.amountInput}
                placeholder="1000"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handlePostWork}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons
                  name="send"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitButtonText}>Post Work</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContent: { paddingBottom: 80 },

  // Updated Header Styles for Logout
  header: {
    backgroundColor: "#0D47A1",
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    flexDirection: "row", // Align items horizontally
    justifyContent: "space-between", // Space out title and logout
    alignItems: "center", // Vertically center
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#E3F2FD",
    marginTop: 8,
    fontWeight: "500",
  },
  logoutButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 50,
  },

  formBody: { padding: 20 },
  inputContainer: { marginBottom: 18 },
  label: {
    fontSize: 12,
    color: "#0D47A1",
    marginBottom: 8,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  inputIcon: { marginLeft: 12 },
  input: { flex: 1, padding: 14, fontSize: 16, color: "#000" },
  rowContainer: { flexDirection: "row", justifyContent: "space-between" },
  halfWidth: { width: "48%" },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
    elevation: 2,
  },
  dropdownText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    flex: 1,
    marginLeft: 10,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
    elevation: 2,
  },
  rupeeIcon: { marginRight: 10 },
  amountInput: { flex: 1, fontSize: 18, fontWeight: "700", color: "#0D47A1" },
  submitButton: {
    backgroundColor: "#0D47A1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 5,
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  locationToggle: {
    flexDirection: "row",
    backgroundColor: "#E0E7FF",
    borderRadius: 12,
    marginBottom: 10,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleActive: { backgroundColor: "#fff", elevation: 2 },
  toggleText: { color: "#666", fontWeight: "600", fontSize: 13 },
  toggleTextActive: { color: "#0D47A1", fontWeight: "700" },
  locationBox: {
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
    borderRadius: 12,
    padding: 15,
    backgroundColor: "#fff",
    alignItems: "flex-start",
  },
  detectButton: {
    flexDirection: "row",
    backgroundColor: "#FF9F43",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  detectButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 14,
  },
  detectedAddress: {
    marginTop: 10,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0D47A1" },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryItemText: { fontSize: 16, color: "#333", marginLeft: 15, flex: 1 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
});

export default PostNewWorkScreen;
