import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useState } from "react"; // Added useEffect
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CategoryFilterModal from "../../components/RenderModal";
// IMPORT YOUR PRICING DATA HERE
import {
  labourLinePricing,
  uploadToImgBB,
  workCategories,
} from "../src/store/WorkData";
import {
  getAddressFromCoords,
  getUserCoordinates,
} from "../src/store/locationUtils";

const PostNewWorkScreen = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // --- NEW STATE FOR PRICING ENGINE ---
  const [selectedSubCategoryData, setSelectedSubCategoryData] = useState(null);
  const [pricingModel, setPricingModel] = useState("manual"); // 'manual', 'shift', 'measurement', 'task'

  // Specific inputs for different models
  const [measurementInput, setMeasurementInput] = useState(""); // For Sq Ft / Acres
  const [shiftType, setShiftType] = useState("fullDay"); // 'fullDay' or 'halfDay'
  const [selectedTaskItems, setSelectedTaskItems] = useState([]); // For Electrician/Plumber items

  // Location State
  const [locationMode, setLocationMode] = useState("current");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Media State
  const [image, setImage] = useState(null);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // ... (Keep existing Audio/Image functions: startRecording, stopRecording, pickImage, handleLogout) ...
  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );
        setRecording(recording);
        setIsRecording(true);
      } else {
        Alert.alert("Permission to access microphone is required!");
      }
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
    } catch (error) {
      console.error("Stop recording error", error);
    }
  }

  const pickImage = async () => {
    Alert.alert("Upload Image", "Choose an option", [
      {
        text: "Camera",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (permission.status !== "granted")
            return Alert.alert("Permission denied");
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
          });
          if (!result.canceled) setImage(result.assets[0].uri);
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
          });
          if (!result.canceled) setImage(result.assets[0].uri);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    router.replace("/src/screens/LoginScreen");
  };

  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await getUserCoordinates();
      if (coords) {
        setCoordinates(coords);
        const fullAddress = await getAddressFromCoords(
          coords.latitude,
          coords.longitude,
        );
        if (fullAddress) {
          setAddress(fullAddress);
        }
      }
    } catch (error) {
      console.error("Location handling error:", error);
      Alert.alert("Error", "Could not complete location detection.");
    } finally {
      setIsLocating(false);
    }
  };

  // --- NEW: LOGIC TO FIND PRICING MODEL FROM CATEGORY LABEL ---
  const handleCategorySelection = (label) => {
    setCategory(label);
    setModalVisible(false);

    // Reset pricing states
    setMeasurementInput("");
    setShiftType("fullDay");
    setSelectedTaskItems([]);
    setAmount("");

    // Find the deep object in labourLinePricing
    let foundSub = null;
    if (labourLinePricing) {
      for (const mainCat of labourLinePricing) {
        const sub = mainCat.subCategories.find((s) => s.label === label);
        if (sub) {
          foundSub = sub;
          break;
        }
      }
    }

    if (foundSub && foundSub.pricing) {
      setSelectedSubCategoryData(foundSub);
      setPricingModel(foundSub.pricing.model);

      // Auto-set initial amount if it's shift based
      if (foundSub.pricing.model === "shift") {
        setAmount(foundSub.pricing.rates.fullDay.toString());
        setDuration("8 Hours");
      }
    } else {
      // Fallback to manual if no pricing data found
      setPricingModel("manual");
      setSelectedSubCategoryData(null);
    }
  };

  // --- NEW: DYNAMIC PRICE CALCULATORS ---

  // 1. Shift Calculator
  const handleShiftSelect = (type) => {
    setShiftType(type);
    if (selectedSubCategoryData) {
      const rates = selectedSubCategoryData.pricing.rates;
      const price = type === "fullDay" ? rates.fullDay : rates.halfDay;
      setAmount(price.toString());
      setDuration(type === "fullDay" ? "8 Hours" : "4 Hours");
    }
  };

  // 2. Measurement Calculator (Sq Ft / Acres)
  const handleMeasurementChange = (val) => {
    setMeasurementInput(val);
    if (val && selectedSubCategoryData) {
      const rate = selectedSubCategoryData.pricing.baseRate;
      const total = parseFloat(val) * rate;
      const final = Math.max(
        total,
        selectedSubCategoryData.pricing.minJobValue || 0,
      );
      setAmount(final.toString());
      setDuration("Task Based");
    } else {
      setAmount("");
    }
  };

  // 3. Task Menu Calculator
  const toggleTaskItem = (item, price) => {
    // Simple toggle logic for demo
    const exists = selectedTaskItems.find((i) => i.item === item);
    let updatedList = [];
    if (exists) {
      updatedList = selectedTaskItems.filter((i) => i.item !== item);
    } else {
      updatedList = [...selectedTaskItems, { item, price }];
    }
    setSelectedTaskItems(updatedList);

    // Recalculate Total
    let total = selectedSubCategoryData.pricing.visitCharge || 0;
    updatedList.forEach((t) => (total += t.price));
    setAmount(total.toString());
    setDuration("Task Based");
  };

  const handlePostWork = async () => {
    if (!jobTitle || !amount || !category) {
      Alert.alert("Error", "Please fill in Job Title, Category, and Budget.");
      return;
    }

    if (locationMode === "manual" && !address.trim()) {
      Alert.alert("Error", "Please enter a valid address.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const decoded = jwtDecode(token);

      let finalLat = coordinates?.latitude;
      let finalLng = coordinates?.longitude;

      if (locationMode === "manual") {
        try {
          const geocodedLocation = await Location.geocodeAsync(address);
          if (geocodedLocation.length > 0) {
            finalLat = geocodedLocation[0].latitude;
            finalLng = geocodedLocation[0].longitude;
          } else {
            setLoading(false);
            Alert.alert("Location Error", "Could not find coordinates.");
            return;
          }
        } catch (e) {
          console.error(e);
          setLoading(false);
          return;
        }
      }

      if (!finalLat || !finalLng) {
        finalLat = 18.5204;
        finalLng = 73.8567;
      }

      const uploadAudioMedia = async (uri) => {
        const formData = new FormData();
        const filename = uri.split("/").pop();
        formData.append("file", { uri, name: filename, type: "audio/m4a" });
        const uploadResponse = await fetch(
          `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/upload/media`,
          {
            method: "POST",
            body: formData,
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          return result.url;
        }
        return "none";
      };

      let finalAudioUrl = "none";
      let finalImageUrl =
        "https://img.freepik.com/free-vector/construction-worker-concept-illustration_114360-5093.jpg"; // Default placeholder

      if (audioUri) finalAudioUrl = await uploadAudioMedia(audioUri);
      if (image) {
        const imgbbUrl = await uploadToImgBB(image);
        if (imgbbUrl) finalImageUrl = imgbbUrl;
      }

      // --- ENHANCED DESCRIPTION ---
      // Append the pricing details to the description so the worker sees exactly what the job entails
      let enhancedDescription = `Duration: ${duration}. `;
      if (pricingModel === "measurement")
        enhancedDescription += `Scope: ${measurementInput} ${selectedSubCategoryData.pricing.unit}. `;
      if (pricingModel === "task_based") {
        const taskNames = selectedTaskItems.map((t) => t.item).join(", ");
        enhancedDescription += `Tasks: ${taskNames}. `;
      }

      const payload = {
        title: jobTitle,
        description: enhancedDescription,
        audioUrl: finalAudioUrl,
        skillsRequired: category,
        earning: parseFloat(amount),
        location: address || "Pune, Maharashtra",
        latitude: finalLat,
        longitude: finalLng,
        image: finalImageUrl,
        employerId: decoded.id,
      };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/post-work`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        Alert.alert("Success", "Work posted successfully!", [
          { text: "OK", onPress: () => router.replace("YouPostedScreen") },
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // --- COMPONENT: RENDER PRICING SECTION ---
  const renderPricingSection = () => {
    // 1. MANUAL OR DEFAULT
    if (pricingModel === "manual") {
      return (
        <View style={styles.amountContainer}>
          <FontAwesome5
            name="rupee-sign"
            size={18}
            color="#FFC107"
            style={styles.rupeeIcon}
          />
          <TextInput
            style={styles.amountInput}
            placeholder="500"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      );
    }

    // 2. SHIFT BASED (Full Day / Half Day)
    if (pricingModel === "shift") {
      return (
        <View style={styles.shiftContainer}>
          <TouchableOpacity
            style={[
              styles.shiftBtn,
              shiftType === "fullDay" && styles.shiftBtnActive,
            ]}
            onPress={() => handleShiftSelect("fullDay")}
          >
            <Text
              style={[
                styles.shiftText,
                shiftType === "fullDay" && styles.shiftTextActive,
              ]}
            >
              Full Day (8h){"\n"}₹
              {selectedSubCategoryData.pricing.rates.fullDay}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shiftBtn,
              shiftType === "halfDay" && styles.shiftBtnActive,
            ]}
            onPress={() => handleShiftSelect("halfDay")}
          >
            <Text
              style={[
                styles.shiftText,
                shiftType === "halfDay" && styles.shiftTextActive,
              ]}
            >
              Half Day (4h){"\n"}₹
              {selectedSubCategoryData.pricing.rates.halfDay}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // 3. MEASUREMENT BASED (Sq Ft)
    if (pricingModel === "measurement") {
      return (
        <View>
          <View style={styles.amountContainer}>
            <Text style={{ fontWeight: "bold", color: "#555" }}>
              Area ({selectedSubCategoryData.pricing.unit}):{" "}
            </Text>
            <TextInput
              style={styles.amountInput}
              placeholder="e.g. 100"
              keyboardType="numeric"
              value={measurementInput}
              onChangeText={handleMeasurementChange}
            />
          </View>
          <Text style={styles.helperText}>
            Standard Rate: ₹{selectedSubCategoryData.pricing.baseRate}/
            {selectedSubCategoryData.pricing.unit}
          </Text>
          {amount !== "" && (
            <Text style={styles.calculatedText}>Total Est: ₹{amount}</Text>
          )}
        </View>
      );
    }

    // 4. TASK BASED (Menu)
    if (pricingModel === "task_based") {
      return (
        <View>
          <Text style={styles.sectionHeader}>
            Select Tasks (Includes ₹
            {selectedSubCategoryData.pricing.visitCharge} visit fee)
          </Text>
          {selectedSubCategoryData.pricing.rateCard.map((item, index) => {
            const isSelected = selectedTaskItems.some(
              (i) => i.item === item.item,
            );
            return (
              <TouchableOpacity
                key={index}
                style={[styles.taskItem, isSelected && styles.taskItemActive]}
                onPress={() => toggleTaskItem(item.item, item.price)}
              >
                <Text
                  style={
                    isSelected
                      ? { color: "white", fontWeight: "bold" }
                      : { color: "#333" }
                  }
                >
                  {item.item}
                </Text>
                <Text
                  style={
                    isSelected
                      ? { color: "white", fontWeight: "bold" }
                      : { color: "#0D47A1", fontWeight: "bold" }
                  }
                >
                  ₹{item.price}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={styles.totalBox}>
            <Text style={styles.totalText}>Total Budget: ₹{amount || 0}</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <CategoryFilterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        categories={workCategories}
        onSelect={(label) => handleCategorySelection(label)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Post New Work</Text>
            <Text style={styles.headerSubtitle}>Hire Skill in Seconds</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.formBody}>
          {/* ... Job Title Input ... */}
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
                placeholder="e.g Help with moving"
                value={jobTitle}
                onChangeText={setJobTitle}
              />
            </View>
          </View>

          {/* ... Category & Duration ... */}
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
                >
                  {category || "Select"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>DURATION</Text>
              <View
                style={[styles.inputWrapper, { backgroundColor: "#f0f0f0" }]}
              >
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color="#0D47A1"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: "#555" }]}
                  placeholder="Auto-calc"
                  value={duration}
                  editable={false} // Make Duration Auto-Calculated mostly
                />
              </View>
            </View>
          </View>

          {/* ... DYNAMIC PRICING SECTION ... */}
          <View style={styles.pricingWrapper}>
            <Text style={styles.label}>
              {pricingModel === "manual"
                ? "BUDGET"
                : "CALCULATED BUDGET (Standard Rates applied)"}
            </Text>

            {renderPricingSection()}
          </View>

          {/* ... Media Buttons ... */}
          <View style={[styles.mediaRow, { marginTop: 20 }]}>
            {/* ... Keep your existing Media Buttons code exactly as is ... */}
            <TouchableOpacity
              style={[
                styles.mediaButton,
                isRecording && styles.recordingActive,
                audioUri && styles.mediaSuccess,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <MaterialIcons
                name={isRecording ? "stop" : "mic"}
                size={24}
                color={isRecording ? "#FFF" : "#0D47A1"}
              />
              <Text
                style={[styles.mediaText, isRecording && { color: "white" }]}
              >
                {isRecording ? "Stop" : audioUri ? "Recorded" : "Add Voice"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaButton, image && styles.mediaSuccess]}
              onPress={pickImage}
            >
              <MaterialIcons name="camera-alt" size={24} color="#0D47A1" />
              <Text style={styles.mediaText}>
                {image ? "Image Added" : "Add Photo"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ... Image Preview Code ... */}
          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => setImage(null)}
              >
                <MaterialIcons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* ... LOCATION SECTION (Keep exactly as before) ... */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>WORK LOCATION</Text>
            <View style={styles.locationToggle}>
              {/* ... Keep your existing location toggle buttons ... */}
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
                  Current
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
                  Manual
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
                  <Text style={styles.detectButtonText}>Detect Location</Text>
                </TouchableOpacity>
                {address ? (
                  <Text style={styles.detectedAddress}>{address}</Text>
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
                  placeholder="Enter full address"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>
            )}
          </View>

          {/* ... SUBMIT BUTTON ... */}
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
                <Text style={styles.submitButtonText}>
                  {amount ? `Post Job for ₹${amount}` : "Post Work"}
                </Text>
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
  header: {
    backgroundColor: "#0D47A1",
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "#E3F2FD", marginTop: 5 },
  logoutButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 50,
  },
  formBody: { padding: 20 },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 12, color: "#0D47A1", marginBottom: 8, fontWeight: "700" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    borderRadius: 12,
    backgroundColor: "#fff",
    height: 50,
  },
  inputIcon: { marginLeft: 12 },
  input: { flex: 1, padding: 10, fontSize: 16, color: "#000" },
  rowContainer: { flexDirection: "row", justifyContent: "space-between" },
  halfWidth: { width: "48%" },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    borderRadius: 12,
    backgroundColor: "#fff",
    height: 50,
    paddingHorizontal: 10,
  },
  dropdownText: { fontSize: 14, color: "#000", flex: 1, marginLeft: 10 },
  mediaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  mediaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#0D47A1",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  recordingActive: { backgroundColor: "#FF3B30", borderColor: "#FF3B30" },
  mediaSuccess: { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" },
  mediaText: { marginLeft: 8, color: "#0D47A1", fontWeight: "600" },
  imagePreviewContainer: {
    marginBottom: 20,
    alignItems: "center",
    position: "relative",
  },
  imagePreview: { width: "100%", height: 200, borderRadius: 12 },
  removeImage: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 5,
    borderRadius: 20,
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
  toggleText: { color: "#666", fontWeight: "600" },
  toggleTextActive: { color: "#0D47A1", fontWeight: "700" },
  locationBox: {
    borderWidth: 1,
    borderColor: "#E0E7FF",
    borderRadius: 12,
    padding: 15,
    backgroundColor: "#fff",
  },
  detectButton: {
    flexDirection: "row",
    backgroundColor: "#FF9F43",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  detectButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  detectedAddress: { marginTop: 10, fontSize: 14, color: "#333" },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    borderRadius: 12,
    backgroundColor: "#fff",
    height: 50,
    paddingHorizontal: 10,
  },
  rupeeIcon: { marginRight: 10 },
  amountInput: { flex: 1, fontSize: 18, fontWeight: "700", color: "#0D47A1" },
  submitButton: {
    backgroundColor: "#0D47A1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // --- NEW STYLES FOR PRICING ---
  pricingWrapper: {
    backgroundColor: "#f1f8ff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bbdefb",
  },
  shiftContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shiftBtn: {
    width: "48%",
    padding: 15,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  shiftBtnActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#0D47A1",
    borderWidth: 2,
  },
  shiftText: {
    textAlign: "center",
    color: "#555",
    lineHeight: 20,
  },
  shiftTextActive: {
    color: "#0D47A1",
    fontWeight: "bold",
  },
  helperText: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
    fontStyle: "italic",
  },
  calculatedText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "right",
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#777",
    marginBottom: 10,
  },
  taskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "white",
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  taskItemActive: {
    backgroundColor: "#0D47A1",
    borderColor: "#0D47A1",
  },
  totalBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    alignItems: "center",
  },
  totalText: {
    fontWeight: "bold",
    color: "#e65100",
    fontSize: 16,
  },
});

export default PostNewWorkScreen;
