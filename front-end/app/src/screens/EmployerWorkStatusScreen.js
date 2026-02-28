import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle, MapPin, Phone, User, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [workData, setWorkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [labourLocation, setLabourLocation] = useState(null);
  const mapRef = useRef(null);

  // --- 1. DATA NORMALIZATION ---
  const normalizeAndSetData = (data) => {
    const workObj = data.work ? data.work : data;

    // Check if there's an accepted bid to pull labour from
    const acceptedBid = workObj.bids?.find((b) => b.status === "ACCEPTED");
    const bidLabour = acceptedBid?.worker || acceptedBid?.labour;

    // Grab the labour object from wherever it exists in the JSON hierarchy
    let labourObj =
      data.labour ||
      workObj.acceptedLabour ||
      workObj.labour ||
      bidLabour ||
      {};

    const normalized = {
      work: workObj,
      labour: labourObj,
      status: workObj.status || data.status || "UNKNOWN",
    };

    setWorkData(normalized);
  };

  // --- 2. LIVE LOCATION TRACKING ---
  useEffect(() => {
    let intervalId;

    const fetchLiveLocation = async () => {
      if (!workData?.labour?.id || workData.status === "COMPLETED") return;

      try {
        const token = await AsyncStorage.getItem("userToken");
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/${workData.labour.id}/location`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.lastLatitude && data.lastLongitude) {
            setLabourLocation({
              latitude: data.lastLatitude,
              longitude: data.lastLongitude,
            });
          }
        }
      } catch (error) {
        // Silent fail
      }
    };

    if (workData?.labour?.id) {
      fetchLiveLocation();
      intervalId = setInterval(fetchLiveLocation, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [workData?.labour?.id, workData?.status]);

  // --- 3. MAP CAMERA ANIMATION ---
  useEffect(() => {
    if (labourLocation && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: labourLocation.latitude,
            longitude: labourLocation.longitude,
          },
          zoom: 15,
        },
        { duration: 1000 },
      );
    }
  }, [labourLocation]);

  // --- 4. INITIAL DATA FETCH (UPDATED) ---
  useEffect(() => {
    let isMounted = true;

    const fetchWorkData = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        let initialData = null;

        // 1. Instantly load whatever was passed from the previous screen
        if (params.workData) {
          initialData =
            typeof params.workData === "string"
              ? JSON.parse(params.workData)
              : params.workData;

          if (isMounted) normalizeAndSetData(initialData);
        }

        // 2. ALWAYS fetch the fresh data from the server to get Name and PhoneNo
        // because the list screen payload doesn't contain them
        const workId =
          params.workId || initialData?.work?.id || initialData?.id;

        if (workId) {
          const API_URL = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/work-status?workId=${workId}`;
          const response = await fetch(API_URL, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const freshData = await response.json();
            if (isMounted) {
              normalizeAndSetData(freshData); // Overwrites with full name/phone
            }
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWorkData();

    return () => {
      isMounted = false;
    };
  }, [params.workId, params.workData]);

  const handleCallLabour = () => {
    if (workData?.labour?.phoneNo) {
      Linking.openURL(`tel:${workData.labour.phoneNo}`);
    } else {
      Alert.alert(t("common.info"), t("employer.phoneNotAvailable"));
    }
  };

  const handleMarkCompleted = async () => {
    if (!workData?.work || workData.status === "COMPLETED") return;

    Alert.alert(
      t("employer.confirmCompletionTitle"),
      t("employer.confirmCompletionMessage", {
        amount: workData.work.budget || workData.work.earning,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("employer.yesComplete"),
          style: "default",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("userToken");
              const employerId = workData.work.employer?.id;

              const response = await fetch(
                `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/complete-work?workId=${workData.work.id}&employerId=${employerId}`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                },
              );

              if (response.ok) {
                Alert.alert(
                  t("common.success"),
                  t("employer.workMarkedCompleted"),
                );
                setWorkData((prev) => ({
                  ...prev,
                  status: "COMPLETED",
                  work: { ...prev.work, status: "COMPLETED" },
                }));
              } else {
                const errorText = await response.text();
                Alert.alert(
                  t("common.error"),
                  errorText || t("employer.failedToUpdate"),
                );
              }
            } catch (e) {
              Alert.alert(t("common.error"), t("common.networkError"));
            }
          },
        },
      ],
    );
  };

  if (loading && !workData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1B1464" />
        <Text style={styles.loadingText}>{t("common.loadingDetails")}</Text>
      </View>
    );
  }

  if (!workData || !workData.work) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: "#666", marginBottom: 20 }}>
          {t("common.noDataFound")}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            {t("common.goBack")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { work, labour, status } = workData;
  const hasLocation = work.latitude && work.longitude;
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
                {/* Work Location Marker */}
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

                {/* Live Labour Marker */}
                {labourLocation && (
                  <Marker
                    coordinate={labourLocation}
                    title={labour.name || "Labour"}
                  >
                    <View style={styles.labourMarker}>
                      <User size={20} color="#FFF" />
                    </View>
                  </Marker>
                )}
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <MapPin size={40} color="#ccc" />
                <Text style={{ marginTop: 10, color: "#999" }}>
                  {t("employer.locationNotProvided")}
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
                {labour.name || t("employer.assignedWorker")}
              </Text>
              <Text style={styles.subText}>
                {labour.phoneNo
                  ? `Phone: ${labour.phoneNo}`
                  : t("employer.contactHidden")}
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
              <Text style={styles.otpLabel}>
                {t("employer.startCodeTitle")}
              </Text>
              <Text style={styles.otpDesc}>
                {t("employer.shareWithLabour")}
              </Text>
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
          <Text style={styles.sectionTitle}>{t("employer.jobDetails")}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("employer.jobTitle")}</Text>
            <Text style={styles.detailValue}>{work.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("employer.budgetAmount")}</Text>
            <Text style={[styles.detailValue, { color: "#2ecc71" }]}>
              ₹ {work.bids?.[0]?.bidAmount || work.budget || work.earning}
            </Text>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {isCompleted ? (
            <View style={styles.completedBanner}>
              <CheckCircle size={24} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.completeBtnText}>
                {t("employer.workCompletedBanner")}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={handleMarkCompleted}
            >
              <CheckCircle size={24} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.completeBtnText}>
                {t("employer.markCompleted")}
              </Text>
            </TouchableOpacity>
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
  backBtn: {
    backgroundColor: "#1B1464",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  closeBtn: { padding: 5 },
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
  labourMarker: {
    backgroundColor: "#2ecc71",
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
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
