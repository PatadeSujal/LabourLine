import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
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

const WorkScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState([]); // State for API data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    // 1. Retrieve Token from Storage
    const token = await AsyncStorage.getItem("userToken");

    if (!token) {
      console.log("No token found, redirecting to login...");
      setLoading(false);
      router.replace("/LoginScreen"); // Redirect if not logged in
      return;
    }

    const API_URL = "http://10.62.29.175:8080/labour/open-work";

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Use the dynamic token here
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        // Optional: Handle 401 Unauthorized specifically
        if (response.status === 401) {
          Alert.alert("Session Expired", "Please login again.");
          await AsyncStorage.removeItem("userToken");
          router.replace("/LoginScreen");
          return;
        }
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      Alert.alert("Error", "Failed to load jobs. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleAcceptWork = async (workId) => {
    setLoading(true);

    try {
      // 1. Get Token from Storage
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in to accept work.");
        setLoading(false);
        return;
      }

      const decoded = jwtDecode(token);
      const labourId = decoded.id;

      console.log(`Accepting Work: WorkID=${workId}, LabourID=${labourId}`);

      const API_URL = `http://10.62.29.175:8080/labour/accept-work?labourId=${labourId}&workId=${workId}`;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert("Success", "Work Accepted!");
        console.log(response);
        const acceptedWorkData = await response.json();
        router.push({
          pathname: "/src/screens/WorkStatusScreen",
          params: {
            workData: JSON.stringify(acceptedWorkData), // <--- CRITICAL LINE
          },
        });
      } else {
        const errorText = await response.text();
        Alert.alert("Failed", errorText || "Could not accept work.");
      }
    } catch (error) {
      console.error("Accept Work Error:", error);
      Alert.alert("Network Error", "Check your connection.");
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
      <StatusBar backgroundColor="#FF9F43" barStyle="dark-content" />

      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Select Work</Text>
            <View style={styles.locationPill}>
              <Icon name="location-outline" size={16} color="#000" />
              <Text style={styles.locationText}>Dhankawadi, Pune</Text>
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
          <TouchableOpacity>
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
                onAccept={handleAcceptWork}
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
