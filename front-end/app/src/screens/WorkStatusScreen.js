import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { CheckCircle, MapPin, Navigation, Phone } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { calculateDistance } from "../store/locationUtils";

const WorkStatusScreen = () => {
  const params = useLocalSearchParams();
  const [workData, setWorkData] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [hasReached, setHasReached] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const mapRef = useRef(null);
  const lastSentLocation = useRef({ latitude: 0, longitude: 0 });
  const locationSubscription = useRef(null);

  // 1. Parse Initial Data sent from checkActiveJob
  useEffect(() => {
    console.log("Raw params.workData:", params.workData);
    if (params.workData) {
      try {
        const parsed = JSON.parse(params.workData);
        setWorkData(parsed);

        // Check if job is already completed based on the top-level or nested status
        if (
          parsed.work?.status === "COMPLETED" ||
          parsed.status === "COMPLETED"
        ) {
          setIsCompleted(true);
        }
      } catch (e) {
        console.error("Error parsing work data", e);
      }
    }
  }, [params.workData]);

  // 2. Continuous Status Polling (Keeping your original route as requested)
  useEffect(() => {
    let statusInterval;

    const checkJobStatus = async () => {
      if (!workData?.work?.id || isCompleted) return;

      try {
        const token = await AsyncStorage.getItem("userToken");
        const API_URL = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/work-status/${workData.work.id}?workId=${workData.work.id}`;

        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const latestData = await response.json();
          const currentStatus = latestData.work?.status || latestData.status;

          if (currentStatus === "COMPLETED") {
            setIsCompleted(true);
            Alert.alert(
              "Job Completed!",
              "The employer has confirmed the work. You can now return to the dashboard.",
              [
                {
                  text: "OK",
                  onPress: () => router.replace("/(worker)/WorkScreen"),
                },
              ],
            );
          }
        }
      } catch (error) {
        console.log("Status check failed (silent)");
      }
    };

    statusInterval = setInterval(checkJobStatus, 7000); // Check every 7 seconds
    return () => clearInterval(statusInterval);
  }, [workData?.work?.id, isCompleted]);

  // 3. Location Tracking & Syncing
  useEffect(() => {
    let isMounted = true;

    const startLiveTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (isMounted)
          Alert.alert("Permission denied", "Allow location to navigate.");
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (location) => {
          if (!isMounted || isCompleted) return;

          const { latitude, longitude } = location.coords;
          setMyLocation({ latitude, longitude });

          const distMoved = calculateDistance(
            latitude,
            longitude,
            lastSentLocation.current.latitude,
            lastSentLocation.current.longitude,
          );

          // Update backend only if moved > 20 meters (0.02 km)
          if (distMoved > 0.02) {
            syncLocationWithBackend(latitude, longitude);
            lastSentLocation.current = { latitude, longitude };
          }
        },
      );
    };

    if (!isCompleted) startLiveTracking();

    return () => {
      isMounted = false;
      if (locationSubscription.current) locationSubscription.current.remove();
    };
  }, [isCompleted]);

  const syncLocationWithBackend = async (lat, lng) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const decode = jwtDecode(token);
      await fetch(
        `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/labour/update-location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            labourId: decode.id,
            latitude: lat,
            longitude: lng,
          }),
        },
      );
    } catch (error) {
      console.error("Location sync failed", error);
    }
  };

  // 4. Distance Calculation for "Reached" Status
  useEffect(() => {
    if (myLocation && workData?.work) {
      const d = calculateDistance(
        myLocation.latitude,
        myLocation.longitude,
        workData.work.latitude,
        workData.work.longitude,
      );
      setDistance(d);
      setHasReached(parseFloat(d) < 0.2); // Within 200m
    }
  }, [myLocation, workData]);

  // 5. Back Button Lock (Disabled if completed)
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isCompleted) return false; // Allow back
        Alert.alert(
          "Work in Progress",
          "Tracking is active. You cannot leave this screen.",
        );
        return true; // Prevent back
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [isCompleted]),
  );

  // Show loading spinner until workData is properly parsed
  if (!workData || !workData.work) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D68FF" />
      </View>
    );
  }

  // Safely extract the nested 'work' object from the JSON response
  const { work } = workData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Status */}
        <View style={styles.header}>
          <View style={[styles.badge, isCompleted && styles.completedBadge]}>
            <Text
              style={[
                styles.badgeText,
                isCompleted && styles.completedBadgeText,
              ]}
            >
              {isCompleted ? "COMPLETED" : work.status}
            </Text>
          </View>
        </View>

        {/* Map View */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Route to Work</Text>
            <Text style={styles.distanceText}>
              {distance ? `${distance} km away` : "Locating..."}
            </Text>
          </View>
          <View style={styles.mapWrapper}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: work.latitude,
                longitude: work.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              showsUserLocation={true}
            >
              <Marker
                coordinate={{
                  latitude: work.latitude,
                  longitude: work.longitude,
                }}
              >
                <View style={styles.markerContainer}>
                  <MapPin size={30} color="#FF4D4D" />
                </View>
              </Marker>

              {myLocation && (
                <Polyline
                  coordinates={[
                    myLocation,
                    { latitude: work.latitude, longitude: work.longitude },
                  ]}
                  strokeColor="#2D68FF"
                  strokeWidth={4}
                  lineDashPattern={[5, 5]}
                />
              )}
            </MapView>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() =>
                Linking.openURL(
                  `geo:${work.latitude},${work.longitude}?q=${work.latitude},${work.longitude}`,
                )
              }
            >
              <Navigation size={20} color="#FFF" />
              <Text style={styles.navigateText}>Open Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reached Card */}
        {hasReached && !isCompleted && (
          <View style={styles.reachedCard}>
            <CheckCircle size={24} color="#4CAF50" />
            <Text style={styles.reachedTitle}>You have arrived!</Text>
          </View>
        )}

        {/* Employer Info */}
        {/* Employer Info */}
        <View style={styles.card}>
          <Text style={styles.jobTitle}>{work.title}</Text>
          <Text style={styles.employerName}>
            Employer: {work.employer?.name || "Unknown Employer"}
          </Text>
          <View style={styles.divider} />

          {/* UPDATED: Safely extract bid amount from array */}
          <Text style={styles.earningsValue}>
            Earnings: ₹
            {work.bids && work.bids.length > 0
              ? work.bids[0].bidAmount
              : work.budget}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => {
            if (work.employer?.phoneNo) {
              Linking.openURL(`tel:${work.employer.phoneNo}`);
            } else {
              Alert.alert("Error", "No phone number available");
            }
          }}
        >
          <Phone size={20} color="#2196F3" />
          <Text style={styles.contactButtonText}>Call Employer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20 },
  header: { alignItems: "center", marginBottom: 15 },
  badge: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  completedBadge: { backgroundColor: "#E8F5E9" },
  badgeText: { color: "#2196F3", fontWeight: "bold" },
  completedBadgeText: { color: "#4CAF50" },
  mapCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
    marginBottom: 15,
  },
  mapHeader: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mapTitle: { fontWeight: "bold" },
  distanceText: { color: "#2D68FF", fontWeight: "bold" },
  mapWrapper: { height: 250 },
  map: { flex: 1 },
  navigateButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#2D68FF",
    flexDirection: "row",
    padding: 10,
    borderRadius: 20,
  },
  navigateText: { color: "#FFF", marginLeft: 5, fontWeight: "bold" },
  markerContainer: { backgroundColor: "#FFF", padding: 5, borderRadius: 20 },
  reachedCard: {
    backgroundColor: "#E8F5E9",
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  reachedTitle: { marginLeft: 10, color: "#2E7D32", fontWeight: "bold" },
  card: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 20,
    elevation: 2,
    marginBottom: 15,
  },
  jobTitle: { fontSize: 18, fontWeight: "bold" },
  employerName: { color: "#777", marginTop: 5 },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 10 },
  earningsValue: { fontSize: 18, fontWeight: "bold", color: "#2D68FF" },
  contactButton: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  contactButtonText: { marginLeft: 10, fontWeight: "bold" },
});

export default WorkStatusScreen;
