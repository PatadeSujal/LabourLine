import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle, MapPin, Phone, User, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const EmployerWorkStatusScreen = () => {
  const params = useLocalSearchParams();
  const [workData, setWorkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [labourLocation, setLabourLocation] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let intervalId;

    const fetchLiveLocation = async () => {
      // Only fetch if we have a valid labour ID and work is active
      if (!workData?.labour?.id || workData.status === "COMPLETED") return;

      try {
        const token = await AsyncStorage.getItem("userToken");
        // Call the new GET endpoint
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/${workData.labour.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Last latitude ", data);
          if (data.lastLatitude && data.lastLongitude) {
            setLabourLocation({
              latitude: data.lastLatitude,
              longitude: data.lastLongitude,
            });
          }
        }
      } catch (error) {
        console.log("Live tracking error (silent):", error);
      }
    };

    // 1. Initial Call
    if (workData?.labour?.id) {
      fetchLiveLocation();

      // 2. Set Interval to poll every 10 seconds
      intervalId = setInterval(fetchLiveLocation, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [workData?.labour?.id, workData?.status]);

  useEffect(() => {
    if (labourLocation && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: labourLocation.latitude,
            longitude: labourLocation.longitude,
          },
          zoom: 15,
          pitch: 0,
          heading: 0,
        },
        { duration: 1000 },
      );
    }
  }, [labourLocation]);

  useEffect(() => {
    let isMounted = true;

    const fetchWorkData = async () => {
      console.log("WorkStatusScreen Params:", params);

      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          if (isMounted)
            Alert.alert("Auth Error", "Session expired. Please login again.");
          return;
        }

        // Priority 1: Data passed via navigation
        if (params.workData) {
          const parsed =
            typeof params.workData === "string"
              ? JSON.parse(params.workData)
              : params.workData;

          if (isMounted) {
            normalizeAndSetData(parsed);
            setLoading(false);
          }
          return;
        }

        // Priority 2: Fetch by ID
        if (params.workId) {
          const API_URL = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/work-status/${params.workId}?workId=${params.workId}`;
          console.log("Fetching from:", API_URL);

          const response = await fetch(API_URL, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Data", data);
            if (isMounted) normalizeAndSetData(data);
          } else {
            const errorText = await response.text();
            console.log("Server Error:", errorText);
            if (isMounted)
              Alert.alert("Error", "Could not fetch work details.");
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        if (isMounted) Alert.alert("Error", "Network request failed.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWorkData();

    return () => {
      isMounted = false;
    };
  }, [params.workId, params.workData]);

  const normalizeAndSetData = (data) => {
    const normalized = {
      work: data.work ? data.work : data,
      labour: data.labour ? data.labour : data.work?.labour || {},
      status: data.status || "UNKNOWN",
    };
    setWorkData(normalized);
  };

  const handleCallLabour = () => {
    if (workData?.labour?.phoneNo) {
      Linking.openURL(`tel:${workData.labour.phoneNo}`);
    } else {
      Alert.alert("Info", "Phone number not available.");
    }
  };

  const handleMarkCompleted = async () => {
    // Safety check: Don't allow if already completed
    if (!workData?.work || workData.status === "COMPLETED") return;

    Alert.alert(
      "Confirm Completion",
      `Are you sure you want to complete this work and release ₹${workData.work.earning}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Complete",
          style: "default",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("userToken");

              const response = await fetch(
                `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/complete-work?workId=${workData.work.id}&employerId=${workData.work.employer.id}`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                },
              );

              if (response.ok) {
                Alert.alert("Success", "Work Marked as Completed!");
                // Update local state to reflect completion immediately
                setWorkData((prev) => ({ ...prev, status: "COMPLETED" }));
              } else {
                const errorText = await response.text();
                Alert.alert("Error", errorText || "Failed to update status.");
              }
            } catch (e) {
              Alert.alert("Error", "Network error occurred.");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1B1464" />
        <Text style={styles.loadingText}>Loading Details...</Text>
      </View>
    );
  }

  if (!workData || !workData.work) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: "#666", marginBottom: 20 }}>No Data Found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { work, labour, status } = workData;
  const hasLocation =
    work.latitude && work.longitude && !isNaN(parseFloat(work.latitude));
  console.log("has location ", work.longitude);
  const isCompleted = status === "COMPLETED";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
          >
            <X size={24} color="#666" />
          </TouchableOpacity>
          <View style={[styles.badge, isCompleted && styles.completedBadge]}>
            <Text
              style={[
                styles.badgeText,
                isCompleted && styles.completedBadgeText,
              ]}
            >
              {isCompleted ? "Completed" : "In Progress"}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Map Section */}
        {/* Map Section */}
        <View style={styles.mapCard}>
          <View style={styles.mapWrapper}>
            {hasLocation ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: parseFloat(work.latitude),
                  longitude: parseFloat(work.longitude),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                {/* 1. Static Work Location (Existing) */}
                <Marker
                  coordinate={{
                    latitude: parseFloat(work.latitude),
                    longitude: parseFloat(work.longitude),
                  }}
                  title="Work Location"
                >
                  <View style={styles.markerContainer}>
                    <MapPin size={24} color="#1B1464" />
                  </View>
                </Marker>

                {/* 2. DYNAMIC LABOUR LOCATION (This was missing) */}
                {labourLocation && (
                  <>
                    <Marker
                      coordinate={labourLocation}
                      title={labour.name || "Labour"}
                    >
                      {/* Green Marker for Labour */}
                      <View
                        style={{
                          backgroundColor: "#2ecc71",
                          padding: 6,
                          borderRadius: 20,
                          borderWidth: 2,
                          borderColor: "#FFF",
                        }}
                      >
                        <User size={20} color="#FFF" />
                      </View>
                    </Marker>
                  </>
                )}
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <MapPin size={40} color="#ccc" />
                <Text style={{ marginTop: 10, color: "#999" }}>
                  Location not provided
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Labour Info Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.labourAvatar}>
              <User size={24} color="#1B1464" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.jobTitle}>
                {labour.name || "Waiting for Labour..."}
              </Text>
              <Text style={styles.subText}>
                {labour.phoneNo ? `Phone: ${labour.phoneNo}` : "Contact Hidden"}
              </Text>
            </View>
            {labour.phoneNo && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={handleCallLabour}
              >
                <Phone size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          {/* OTP Section */}
          <View style={styles.otpRow}>
            <View>
              <Text style={styles.otpLabel}>Start Code</Text>
              <Text style={styles.otpDesc}>Share with labour</Text>
            </View>
            <View style={styles.otpBox}>
              <Text style={styles.otpText}>
                {(work.id ? work.id * 1234 : 0).toString().slice(-4)}
              </Text>
            </View>
          </View>
        </View>

        {/* Job Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Title</Text>
            <Text style={styles.detailValue}>{work.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, { color: "#2ecc71" }]}>
              ₹ {work.earning}
            </Text>
          </View>
        </View>

        {/* Footer Actions - CONDITIONAL RENDERING */}
        <View style={styles.footer}>
          {isCompleted ? (
            // --- VIEW WHEN COMPLETED ---
            <View style={styles.completedBanner}>
              <CheckCircle size={24} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.completeBtnText}>Work Completed</Text>
            </View>
          ) : (
            // --- VIEW WHEN ACTIVE ---
            <>
              <View style={styles.secureBadge}>
                <Text style={styles.secureText}>
                  Click the Mark Completed button only when the work is
                  successfully completed
                </Text>
              </View>

              <TouchableOpacity
                style={styles.completeBtn}
                onPress={handleMarkCompleted}
              >
                <CheckCircle
                  size={24}
                  color="#FFF"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.completeBtnText}>Mark Completed</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F8" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#666" },
  backBtn: { backgroundColor: "#1B1464", padding: 10, borderRadius: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  closeBtn: { padding: 5 },

  // Badge Styles
  badge: {
    backgroundColor: "#FFF4E5",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  badgeText: { color: "#FF9F43", fontWeight: "bold", fontSize: 14 },
  completedBadge: { backgroundColor: "#E8F5E9" },
  completedBadgeText: { color: "#2ecc71" },

  mapCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 15,
    overflow: "hidden",
    height: 200,
    elevation: 2,
  },
  mapWrapper: { flex: 1 },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  markerContainer: {
    padding: 5,
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1B1464",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
  },
  row: { flexDirection: "row", alignItems: "center" },
  labourAvatar: {
    width: 50,
    height: 50,
    backgroundColor: "#E0E7FF",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { marginLeft: 15, flex: 1 },
  jobTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  subText: { color: "#777", fontSize: 13 },
  callBtn: { backgroundColor: "#2ecc71", padding: 10, borderRadius: 10 },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 15 },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 12,
  },
  otpLabel: { fontSize: 14, fontWeight: "bold", color: "#333" },
  otpDesc: { fontSize: 12, color: "#888" },
  otpBox: {
    backgroundColor: "#FFF",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  otpText: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 4,
    color: "#1B1464",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: { fontSize: 14, color: "#666" },
  detailValue: { fontSize: 14, fontWeight: "bold", color: "#333" },
  footer: { marginTop: 10 },
  secureBadge: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
    gap: 5,
  },
  secureText: { fontSize: 12, color: "#666" },

  // Button Styles
  completeBtn: {
    backgroundColor: "#1B1464",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
  },
  completedBanner: {
    backgroundColor: "#2ecc71",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
  },
  completeBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});

export default EmployerWorkStatusScreen;
