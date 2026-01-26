import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { CheckCircle, MapPin, Navigation, Phone } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

const WorkStatusScreen = () => {
  const params = useLocalSearchParams();
  const [workData, setWorkData] = useState(null);

  // Location State
  const [myLocation, setMyLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [hasReached, setHasReached] = useState(false);
  const mapRef = useRef(null);

  // Ref to keep track of the subscription so we can clean it up
  const locationSubscription = useRef(null);

  // --- 1. DATA PARSING EFFECT (Runs only when params.workData changes) ---
  useEffect(() => {
    if (params.workData) {
      try {
        const parsed = JSON.parse(params.workData);
        // Only set state if it's different to prevent loops
        setWorkData((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
            return parsed;
          }
          return prev;
        });
      } catch (e) {
        console.error("Error parsing work data", e);
      }
    }
  }, [params.workData]); // <--- DEPENDENCY FIXED (Strings are safe, Objects are not)

  // --- 2. LOCATION TRACKING EFFECT (Runs Once on Mount) ---
  useEffect(() => {
    let isMounted = true;

    const startLiveTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (isMounted)
          Alert.alert("Permission denied", "Allow location to navigate.");
        return;
      }

      // Store subscription in ref
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          if (!isMounted) return;

          const { latitude, longitude } = location.coords;
          setMyLocation({ latitude, longitude });
        },
      );
    };

    startLiveTracking();

    // CLEANUP FUNCTION
    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []); // <--- EMPTY DEPENDENCY (Runs once)

  // --- 3. DISTANCE CALCULATION EFFECT ---
  // Runs whenever myLocation or workData changes
  useEffect(() => {
    if (myLocation && workData?.work) {
      calculateDistance(
        myLocation.latitude,
        myLocation.longitude,
        workData.work.latitude,
        workData.work.longitude,
      );
    }
  }, [myLocation, workData]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return;

    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    setDistance(d.toFixed(2));

    if (d < 0.2) {
      setHasReached(true);
    } else {
      setHasReached(false);
    }
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  // --- LOCK BACK BUTTON ---
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true; // Disable back button
      };
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, []),
  );

  const handleOpenMaps = () => {
    if (!workData?.work) return;
    const { latitude, longitude } = workData.work;
    const label = workData.work.title || "Work Location";

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });
    Linking.openURL(url);
  };

  const handleCallEmployer = () => {
    if (workData?.work?.employer?.phoneNo) {
      Linking.openURL(`tel:${workData.work.employer.phoneNo}`);
    }
  };

  if (!workData) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#2D68FF" />
      </View>
    );
  }

  const { work, acceptedAt } = workData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          {/* Removed X button since user is locked in */}
          <View style={{ width: 40 }} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>On Duty</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Map Card */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Destination Route</Text>
            <Text style={styles.distanceText}>
              {distance ? `${distance} km away` : "Calculating..."}
            </Text>
          </View>

          <View style={styles.mapWrapper}>
            {work.latitude && work.longitude ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: work.latitude,
                  longitude: work.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                <Marker
                  coordinate={{
                    latitude: work.latitude,
                    longitude: work.longitude,
                  }}
                  title={work.title}
                  description={work.location}
                >
                  <View style={styles.markerContainer}>
                    <MapPin size={30} color="#FF4D4D" fill="#FF4D4D" />
                  </View>
                </Marker>

                {myLocation && (
                  <Polyline
                    coordinates={[
                      {
                        latitude: myLocation.latitude,
                        longitude: myLocation.longitude,
                      },
                      { latitude: work.latitude, longitude: work.longitude },
                    ]}
                    strokeColor="#2D68FF"
                    strokeWidth={4}
                    lineDashPattern={[1]}
                  />
                )}
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Text>Location coordinates missing.</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.navigateButton}
              onPress={handleOpenMaps}
            >
              <Navigation size={20} color="#FFF" fill="#FFF" />
              <Text style={styles.navigateText}>Start Navigation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reached Status */}
        {hasReached && (
          <View style={styles.reachedCard}>
            <View style={styles.reachedHeader}>
              <CheckCircle size={24} color="#4CAF50" />
              <Text style={styles.reachedTitle}>You have arrived!</Text>
            </View>
            <Text style={styles.reachedSub}>
              You are within 200m of the work location.
            </Text>

            <TouchableOpacity
              style={styles.reachedBtn}
              onPress={() => Alert.alert("Updated", "Employer Notified")}
            >
              <Text style={styles.reachedBtnText}>Mark as "Reached"</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Job Info */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.imagePlaceholder}>
              <MapPin size={24} color="#555" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.jobTitle}>{work.title}</Text>
              <Text style={styles.employerName}>
                Employer: {work.employer?.name}
              </Text>
              <Text style={styles.employerName}>{work.location}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsValue}>₹ {work.earning}</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleCallEmployer}
          >
            <Phone size={20} color="#2196F3" fill="#2196F3" />
            <Text style={styles.contactButtonText}>
              Call {work.employer?.name?.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footerBanner}>
        <Text style={styles.footerTextMain}>
          Do not ask for advance payment.
        </Text>
        <Text style={styles.footerTextSub}>
          Receive ₹{work.earning} instantly upon completion.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  closeButton: { backgroundColor: "#FFE5E5", padding: 8, borderRadius: 20 },
  badge: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  badgeText: { color: "#2196F3", fontWeight: "bold", fontSize: 14 },

  // Map Card Styles
  mapCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3,
  },
  mapHeader: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mapTitle: { fontWeight: "bold", fontSize: 16, color: "#333" },
  distanceText: { fontSize: 14, color: "#2D68FF", fontWeight: "bold" },
  mapWrapper: { height: 250, width: "100%", position: "relative" },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  navigateButton: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "#2D68FF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 5,
  },
  navigateText: { color: "#FFF", fontWeight: "bold", marginLeft: 8 },
  markerContainer: {
    padding: 5,
    backgroundColor: "white",
    borderRadius: 20,
    elevation: 2,
  },

  // Reached Card
  reachedCard: {
    backgroundColor: "#E8F5E9",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  reachedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  reachedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginLeft: 10,
  },
  reachedSub: { fontSize: 13, color: "#444", marginBottom: 10 },
  reachedBtn: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  reachedBtnText: { color: "#FFF", fontWeight: "bold" },

  // Standard Card
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  imagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: "#E9ECEF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { marginLeft: 15, flex: 1 },
  jobTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  employerName: { fontSize: 12, color: "#777", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 12 },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningsLabel: { fontSize: 14, color: "#555" },
  earningsValue: { fontSize: 18, fontWeight: "bold", color: "#2D68FF" },

  // Timeline
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A2B2B",
    marginBottom: 15,
  },
  timelineRow: { flexDirection: "row", height: 60 },
  timelineLeft: { alignItems: "center", marginRight: 15 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, flex: 1, backgroundColor: "#E9ECEF" },
  timelineTitle: { fontSize: 14, fontWeight: "bold", color: "#333" },
  timelineTime: { fontSize: 10, color: "#999", marginTop: 2 },

  // Footer
  buttonRow: { marginBottom: 20 },
  contactButton: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  contactButtonText: { fontWeight: "bold", color: "#333" },
  footerBanner: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 15,
  },
  footerTextMain: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
    textAlign: "center",
  },
  footerTextSub: {
    color: "#FFF",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.9,
  },
});

export default WorkStatusScreen;
