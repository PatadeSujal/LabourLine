import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import JobCard from "../../components/JobCard";

const YouPostedScreen = () => {
  const { t } = useTranslation();
  const [postedJobs, setPostedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyJobs = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert(t('common.error'), t('employer.authTokenMissing'));
        return;
      }

      const decoded = jwtDecode(token);
      const userId = decoded.id;

      // Ensure this endpoint returns ALL your active jobs (Open + Accepted)
      const API_URL = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/${userId}/my-open-work`;

      console.log("Fetching jobs from:", API_URL);

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Map API data to JobCard props, BUT preserve raw data with "...job"
        const mappedJobs = data.map((job) => ({
          ...job, // CRITICAL: Keep raw data (like acceptedLabour) for the Status Screen

          // UI Mappings for JobCard
          category: job.skillsRequired || "General",
          title: job.title,
          budget: job.budget,
          postedTime: job.status === "OPEN" ? "Active Now" : job.status,
          duration: job.description?.includes("Duration:")
            ? job.description.split(".")[0].replace("Duration: ", "") + " hrs"
            : "N/A",
          salary: job.budget ? job.budget.toString() : "0",
          distance: job.location || "Pune",
          image: job.image || "https://via.placeholder.com/150",

          // Ensure boolean is set correctly for UI logic
          isBiddingAllowed: job.isBiddingAllowed,
        }));

        setPostedJobs(mappedJobs);
      } else {
        // console.error("API Error:", await response.text());
        Alert.alert(t('common.error'), t('employer.failedToLoadPosts'));
      }
    } catch (error) {
      console.error("Fetch Posted Jobs Error:", error);
      Alert.alert(t('employer.connectionError'), t('employer.couldNotReachServer'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Poll for updates when screen is in focus
  useFocusEffect(
    useCallback(() => {
      fetchMyJobs();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyJobs();
  };

  const handleViewStatus = (work) => {
    console.log("this is handle view status");
    console.log("Handling Action for Job ID:", work.id);
    console.log("Is Bidding Allowed?", work.isBiddingAllowed);

    // CASE 1: Bidding is NO LONGER allowed -> Go to Status Screen
    if (!work.isBiddingAllowed || work.status == "ACCEPTED") {
      router.push({
        pathname: "/src/screens/EmployerWorkStatusScreen",
        params: {
          workData: JSON.stringify(work),
        },
      });
    } else {
      // CASE 2: Bidding IS allowed -> Go to View Bids Screen
      router.push({
        pathname: "/src/screens/ViewBidsScreen",
        params: { workId: work.id },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('employer.dashboardTitle')}</Text>
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color="#fff" />
          <Text style={styles.locationText}>{t('employer.puneLocation')}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF9F43" />
          <Text style={styles.loaderText}>{t('employer.gettingPosts')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {postedJobs.length > 0 ? (
            postedJobs.map((item) => (
              <JobCard
                key={item.id}
                job={item}
                // 1. DYNAMIC BUTTON TEXT
                // If bidding is allowed, show "View Bids", else "View Status"
                mainText={item.isBiddingAllowed ? t('employer.viewBids') : t('employer.viewStatus')}
                // 2. ACTION HANDLERS
                // JobCard calls 'onPressAction' if isBiddingAllowed is true
                onPressAction={() => handleViewStatus(item)}
                // JobCard calls 'onAccept' if mainText is "View Status"
                onAccept={() => handleViewStatus(item)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="work-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>{t('employer.noActivePosts')}</Text>
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
