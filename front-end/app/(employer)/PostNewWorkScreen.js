import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch, // IMPORT SWITCH
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CategoryFilterModal from "../../components/RenderModal";
import { uploadToImgBB, workCategories } from "../src/store/WorkData";
import {
  getAddressFromCoords,
  getUserCoordinates,
} from "../src/store/locationUtils";

const PostNewWorkScreen = () => {
  const { t } = useTranslation();
  // --- FORM STATE ---
  const [jobTitle, setJobTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(""); // This serves as Fixed Price OR Opening Bid
  const [description, setDescription] = useState(""); // Added manual description field

  // --- BIDDING STATE ---
  const [allowBidding, setAllowBidding] = useState(false); // Default: Fixed Price

  // --- SYSTEM STATE ---
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [locationMode, setLocationMode] = useState("current");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // --- MEDIA STATE ---
  const [image, setImage] = useState(null);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // --- AUDIO & IMAGE FUNCTIONS ---
  async function startRecording() {
    try {
      // Check current permission status first
      const { status: currentStatus } = await Audio.getPermissionsAsync();
      let permissionGranted = currentStatus === "granted";

      // Request permission only if not yet determined
      if (!permissionGranted) {
        const { status } = await Audio.requestPermissionsAsync();
        permissionGranted = status === "granted";
      }

      if (!permissionGranted) {
        Alert.alert(
          t('employer.micPermission'),
          t('employer.micPermissionMessage') || "Please enable microphone access in your device settings to record voice descriptions.",
        );
        return;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert(t('common.error'), t('employer.recordingFailed') || "Could not start recording. Please try again.");
    }
  }

  async function stopRecording() {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);

      // Reset audio mode for playback after recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error("Stop recording error", error);
    }
  }

  const pickImage = async () => {
    Alert.alert(t('employer.uploadImage'), t('employer.chooseOption'), [
      {
        text: t('employer.camera'),
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (permission.status !== "granted")
            return Alert.alert(t('common.permissionDenied'));
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
          });
          if (!result.canceled) setImage(result.assets[0].uri);
        },
      },
      {
        text: t('employer.gallery'),
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
      { text: t('common.cancel'), style: "cancel" },
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
      Alert.alert(t('common.error'), t('employer.couldNotCompleteLocation'));
    } finally {
      setIsLocating(false);
    }
  };

  // --- SIMPLE CATEGORY HANDLER ---
  const handleCategorySelection = (label) => {
    setCategory(label);
    setModalVisible(false);
  };

  // --- SUBMIT FUNCTION ---
  const handlePostWork = async () => {
    if (!jobTitle || !amount || !category) {
      Alert.alert(t('common.error'), t('employer.fillRequiredFields'));
      return;
    }

    if (locationMode === "manual" && !address.trim()) {
      Alert.alert(t('common.error'), t('employer.enterValidAddress'));
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const decoded = jwtDecode(token);

      // 1. Location Logic
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
            Alert.alert(t('employer.locationError'), t('employer.couldNotFindCoords'));
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

      // 2. Media Upload Logic — Azure Blob Storage
      const uploadAudioToAzure = async (uri) => {
        const STORAGE_ACCOUNT = process.env.EXPO_PUBLIC_AZURE_STORAGE_ACCOUNT;
        const CONTAINER = process.env.EXPO_PUBLIC_AZURE_STORAGE_CONTAINER;
        const SAS_TOKEN = process.env.EXPO_PUBLIC_AZURE_STORAGE_SAS;

        const fileName = `audio_${Date.now()}.m4a`;
        const uploadUrl = `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER}/${fileName}?${SAS_TOKEN}`;

        try {
          const response = await fetch(uri);
          const blob = await response.blob();

          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "x-ms-blob-type": "BlockBlob",
              "Content-Type": "audio/m4a",
            },
            body: blob,
          });

          if (uploadResponse.ok) {
            // Return URL with SAS token for read access (Azure student packs block anonymous access)
            return `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER}/${fileName}?${SAS_TOKEN}`;
          }
          console.error("Azure upload failed:", uploadResponse.status);
          return "none";
        } catch (error) {
          console.error("Azure upload error:", error);
          return "none";
        }
      };

      let finalAudioUrl = "none";
      let finalImageUrl =
        "https://img.freepik.com/free-vector/construction-worker-concept-illustration_114360-5093.jpg";

      if (audioUri) finalAudioUrl = await uploadAudioToAzure(audioUri);
      if (image) {
        const imgbbUrl = await uploadToImgBB(image);
        if (imgbbUrl) finalImageUrl = imgbbUrl;
      }

      // 3. CONSTRUCT PAYLOAD
      const payload = {
        title: jobTitle,
        description: description || "No additional details provided.",
        skillsRequired: category,

        // --- PRICING DATA SENT TO BACKEND ---
        budget: parseFloat(amount),
        isBiddingAllowed: allowBidding,
        // ------------------------------------

        location: address || "Pune, Maharashtra",
        latitude: finalLat,
        longitude: finalLng,
        image: finalImageUrl,
        audioUrl: finalAudioUrl,
        employerId: decoded.id,
      };

      console.log("Posting Payload:", payload);

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
        Alert.alert(t('common.success'), t('employer.workPosted'), [
          { text: t('common.ok'), onPress: () => router.replace("YouPostedScreen") },
        ]);
      } else {
        const err = await response.text();
        Alert.alert(t('common.error'), t('employer.serverError') + err);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('auth.networkError'), t('employer.couldNotConnect'));
    } finally {
      setLoading(false);
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
            <Text style={styles.headerTitle}>{t('employer.postNewWork')}</Text>
            <Text style={styles.headerSubtitle}>{t('employer.hireSkillInSeconds')}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.formBody}>
          {/* 1. JOB TITLE */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('employer.jobTitleLabel')}</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="work"
                size={20}
                color="#0D47A1"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('employer.jobTitlePlaceholder')}
                value={jobTitle}
                onChangeText={setJobTitle}
              />
            </View>
          </View>

          {/* 2. CATEGORY */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('employer.categoryLabel')}</Text>
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
                {category || t('common.select')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3. SIMPLIFIED PRICING SECTION */}
          {/* 3. SIMPLIFIED PRICING SECTION */}
          <View style={styles.pricingWrapper}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>{t('employer.pricingModel')}</Text>

              {/* TOGGLE CONTAINER */}
              <View style={styles.switchContainer}>
                {/* Option 1: Fixed Price Label */}
                <TouchableOpacity onPress={() => setAllowBidding(false)}>
                  <Text
                    style={[
                      styles.switchText,
                      !allowBidding && styles.activeSwitchText,
                    ]}
                  >
                    {t('employer.fixedPrice')}
                  </Text>
                </TouchableOpacity>

                {/* The Switch Component */}
                <Switch
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={allowBidding ? "#0D47A1" : "#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={(val) => setAllowBidding(val)} // Explicitly pass value
                  value={allowBidding}
                  style={{ marginHorizontal: 10 }}
                />

                {/* Option 2: Bidding Label */}
                <TouchableOpacity onPress={() => setAllowBidding(true)}>
                  <Text
                    style={[
                      styles.switchText,
                      allowBidding && styles.activeSwitchText,
                    ]}
                  >
                    {t('employer.allowBidding')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 15 }]}>
              {allowBidding ? t('employer.estimatedBudget') : t('employer.fixedAmount')}
            </Text>

            <View style={styles.amountContainer}>
              <FontAwesome5
                name="rupee-sign"
                size={18}
                color="#FFC107"
                style={styles.rupeeIcon}
              />
              <TextInput
                style={styles.amountInput}
                placeholder={
                  allowBidding ? t('employer.biddingPlaceholder') : t('employer.fixedPlaceholder')
                }
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <Text style={styles.helperText}>
              {allowBidding
                ? t('employer.biddingHelperText')
                : t('employer.fixedHelperText')}
            </Text>
          </View>

          {/* 5. MEDIA BUTTONS */}
          <View style={styles.mediaRow}>
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
                {isRecording ? t('employer.stop') : audioUri ? t('employer.recorded') : t('employer.addVoice')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaButton, image && styles.mediaSuccess]}
              onPress={pickImage}
            >
              <MaterialIcons name="camera-alt" size={24} color="#0D47A1" />
              <Text style={styles.mediaText}>
                {image ? t('employer.imageAdded') : t('employer.addPhoto')}
              </Text>
            </TouchableOpacity>
          </View>

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

          {/* 6. LOCATION SECTION */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('employer.workLocationLabel')}</Text>
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
                  {t('employer.current')}
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
                  {t('employer.manual')}
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
                  <Text style={styles.detectButtonText}>{t('employer.detectLocation')}</Text>
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
                  placeholder={t('employer.enterFullAddress')}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>
            )}
          </View>

          {/* 7. SUBMIT BUTTON */}
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
                  {allowBidding
                    ? t('employer.postAndWaitForBids')
                    : t('employer.postFixedPriceJob')}
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

  // --- PRICING SECTION STYLES ---
  pricingWrapper: {
    backgroundColor: "#f1f8ff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bbdefb",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  activeSwitchText: {
    color: "#0D47A1",
    fontWeight: "bold",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    borderRadius: 12,
    backgroundColor: "#fff",
    height: 50,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  rupeeIcon: { marginRight: 10 },
  amountInput: { flex: 1, fontSize: 18, fontWeight: "700", color: "#0D47A1" },
  helperText: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
    fontStyle: "italic",
  },

  // --- MEDIA STYLES ---
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

  // --- LOCATION STYLES ---
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

  submitButton: {
    backgroundColor: "#0D47A1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default PostNewWorkScreen;
