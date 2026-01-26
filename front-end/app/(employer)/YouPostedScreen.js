import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import JobCard from "../../components/JobCard";

const YouPostedScreen = () => {
  const [postedJobs, setPostedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyJobs = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        router.replace("/src/screen/LoginScreen");
        return;
      }

      const decoded = jwtDecode(token);
      const userId = decoded.id;

      // Update IP to match your current server address
      const API_URL = `http://10.62.29.175:8080/employer/${userId}/my-open-work`;

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Mapping API data to match your JobCard's expected prop structure
        const mappedJobs = data.map((job) => ({
          id: job.id,
          category: job.skillsRequired || "General",
          title: job.title,
          postedTime: job.status === "OPEN" ? "Active Now" : job.status,
          // Extracting duration from description if formatted as "Duration: 6..."
          duration: job.description?.includes("Duration:")
            ? job.description.split(".")[0].replace("Duration: ", "") + " hrs"
            : "N/A",
          salary: job.earning ? job.earning.toString() : "0",
          distance: job.location || "Pune",
          // Fix: Passing image as a string to avoid casting errors in JobCard
          image: job.image || "https://via.placeholder.com/150",
        }));

        setPostedJobs(mappedJobs);
      } else {
        Alert.alert("Error", "Failed to load your posted jobs.");
      }
    } catch (error) {
      console.error("Fetch Posted Jobs Error:", error);
      Alert.alert("Connection Error", "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      fetchMyJobs();

      return () => {};
    }, []),
  );

  const handleViewStatus = (id) => {
    router.push({
      pathname: "/src/screens/EmployerWorkStatusScreen",
      params: {
        workId: id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>You Posted</Text>
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color="#fff" />
          <Text style={styles.locationText}>Pune, Maharashtra</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF9F43" />
          <Text style={styles.loaderText}>Getting your posts...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {postedJobs.length > 0 ? (
            postedJobs.map((item) => (
              <JobCard
                key={item.id}
                job={item}
                mainText={"View Status"}
                onAccept={() => handleViewStatus(item.id)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="work-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No active job posts found.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#0D47A1",
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  locationText: { color: "#fff", marginLeft: 5, fontWeight: "500" },
  scrollContent: { padding: 15, paddingBottom: 80 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 10, color: "#FF9F43", fontWeight: "600" },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 15, color: "#888", fontSize: 16 },
});

export default YouPostedScreen;
