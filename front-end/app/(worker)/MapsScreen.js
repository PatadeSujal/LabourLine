import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import JobCard from "../../components/JobCard";
import { getUserCoordinates } from "../src/store/locationUtils";
import { acceptWorkApi } from "../src/store/workService";

const { width, height } = Dimensions.get("window");

// Custom Map Style
const mapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

const MapsScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [jobs, setJobs] = useState([]); // State for API data
  const [loading, setLoading] = useState(true);

  const fetchMapJobs = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      // Use your open-work endpoint
      const url = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/labour/open-work`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Map Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const initializeMap = async () => {
      // Get real user location using your util
      const coords = await getUserCoordinates();
      if (coords) setUserLocation(coords);

      // Fetch the actual jobs
      await fetchMapJobs();
    };

    initializeMap();
  }, []);
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  const handleAcceptWork = async (workId) => {
    setLoading(true);
    try {
      // Call the generalized API function
      const acceptedWorkData = await acceptWorkApi(workId);

      Alert.alert("Success", "Work Accepted!");

      // Navigate using the returned data
      router.push({
        pathname: "/src/screens/WorkStatusScreen",
        params: {
          workData: JSON.stringify(acceptedWorkData),
        },
      });
    } catch (error) {
      Alert.alert("Failed", error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={mapStyle}
        initialRegion={
          userLocation
            ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : {
                latitude: 18.462, // Default Pune center
                longitude: 73.852,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }
        }
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            pinColor="#007AFF"
          />
        )}

        {/* 2. Plot Dynamic Jobs from the 'jobs' state */}
        {jobs.map((job) => (
          <Marker
            key={job.id}
            coordinate={{
              latitude: parseFloat(job.latitude),
              longitude: parseFloat(job.longitude),
            }}
            onPress={() => setSelectedMarker(job)}
            anchor={{ x: 0.5, y: 1.0 }}
          >
            <View
              style={[
                styles.markerContainer,
                selectedMarker?.id === job.id && styles.markerSelected,
              ]}
            >
              <View style={styles.priceBubble}>
                <Text style={styles.priceText}>
                  ₹{job.earning || job.salary}
                </Text>
              </View>
              <View
                style={[
                  styles.pinCircle,
                  selectedMarker?.id === job.id && styles.pinCircleSelected,
                ]}
              >
                <Icon
                  name={job.category === "Electrical" ? "flash" : "hammer"}
                  size={24}
                  color={selectedMarker?.id === job.id ? "#fff" : "#007AFF"}
                />
              </View>
              <View style={styles.arrow} />
              <View
                style={[
                  styles.pinCircle,
                  selectedMarker?.id === job.id && styles.pinCircleSelected,
                ]}
              >
                <Icon
                  name={job.category === "Electrical" ? "flash" : "hammer"}
                  size={24}
                  color={selectedMarker?.id === job.id ? "#fff" : "#007AFF"}
                />
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* 3. Job Details Overlay */}
      {selectedMarker && (
        <View style={styles.jobDetailsContainer}>
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setSelectedMarker(null)}
          />
          <View style={styles.bottomSheet}>
            <JobCard job={selectedMarker} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    width: width,
    height: height,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    // Removed fixed width/height to allow the bubble to breathe
    padding: 5,
  },
  priceBubble: {
    backgroundColor: "#FF9F43",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    // Add zIndex to ensure it's on top of the icon
    zIndex: 10,
    marginBottom: -2, // Pull it slightly closer to the icon
    elevation: 5, // For Android shadow
    shadowColor: "#000", // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff", // Match your pinCircle background
    marginTop: -2, // Pull up to connect with the circle
  },
  priceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  pinCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 1,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  pinCircleSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#FF9F43",
    borderWidth: 3,
  },
  arrowBorder: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderTopColor: "rgba(0,0,0,0.15)",
    borderWidth: 10,
    alignSelf: "center",
    marginTop: -2,
  },
  arrow: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderTopColor: "#fff",
    borderWidth: 10,
    alignSelf: "center",
    marginTop: -20,
  },
  jobDetailsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheet: {
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: 10,
  },
});

export default MapsScreen;
