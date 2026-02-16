import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { useEffect, useState } from "react"; // Added useEffect
import {
  ActivityIndicator,
  Alert, // Added for loading state
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import JobCard from "../../components/JobCard";
import CategoryFilterModal from "../../components/RenderModal";
import { filterData } from "../src/store/WorkData";
import {
  getCurrentAddress,
  getUserCoordinates,
} from "../src/store/locationUtils";
import { acceptWorkApi } from "../src/store/workService";

const WorkScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState([]); // State for API data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: "",
    maxDistance: null,
    minEarning: null,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("Filters");
  const [currentOptions, setCurrentOptions] = useState(filterData.price);
  const [liveLocation, setLiveLocation] = useState("Fetching location...");
  const handleFilterSelection = async (label) => {
    const distanceMatch = label.match(/\d+/);
    if (!distanceMatch) return;

    const distanceValue = parseInt(distanceMatch[0]);

    setModalVisible(false);
    setLoading(true);

    try {
      const coords = await getUserCoordinates();

      if (coords) {
        const newFilters = {
          ...activeFilters,
          maxDistance: distanceValue,
          userLat: coords.latitude,
          userLng: coords.longitude,
        };

        setActiveFilters(newFilters);
        fetchJobs(newFilters);
      } else {
        Alert.alert("Location Error", "Could not get your location.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const applyFinalFilter = (value) => {
    console.log("Applying filter:", value);
    // Logic to update your API payload here
    setModalVisible(false);
  };

  const resetToMainMenu = () => {
    setModalTitle("Filters");
    setCurrentOptions(filterData.main);
  };
  const fetchJobs = async (filtersToApply = {}) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      let url = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/labour/open-work?`;

      if (filtersToApply.maxDistance) {
        url += `maxDistance=${filtersToApply.maxDistance}&`;
        url += `userLat=${filtersToApply.userLat}&`;
        url += `userLng=${filtersToApply.userLng}&`;
      }

      console.log("Fetching with distance filter:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    // Use the generalized function
    const initializeLocation = async () => {
      const address = await getCurrentAddress();
      if (address) {
        setLiveLocation(address);
      } else {
        setLiveLocation("Location Not Found"); // Default fallback
      }
    };

    initializeLocation();
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

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

  // Filter jobs based on search input
  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="#FF9F43"
        barStyle="dark-content"
      />

      <CategoryFilterModal
        visible={modalVisible}
        categories={currentOptions}
        onSelect={handleFilterSelection}
        onClose={() => setModalVisible(false)}
        title="Select Distance"
      />

      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Select Work</Text>
            <View style={styles.locationPill}>
              <Icon name="location-outline" size={16} color="#000" />
              <Text style={styles.locationText}>{liveLocation}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="notifications" size={24} color="#000" />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Icon
            name="search-outline"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Jobs..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            onPress={() => {
              setCurrentOptions(filterData.distance);
              setModalVisible(true);
            }}
          >
            <Icon name="filter-outline" size={20} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#FF9F43"
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                // onAccept={handleAcceptWork}
                mainText={"Accept"}
              />
            ))
          ) : (
            <Text style={styles.noJobsText}>No jobs found at the moment.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const additionalStyles = StyleSheet.create({
  noJobsText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 16,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  headerContainer: {
    backgroundColor: "#FF9F43",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  locationText: {
    marginLeft: 5,
    fontWeight: "600",
    color: "#000",
  },
  notificationButton: {
    position: "relative",
    padding: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 50,
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
    borderWidth: 1,
    borderColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: 2,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
});

export default WorkScreen;
