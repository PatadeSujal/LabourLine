import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
  TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

// COMPONENTS
import BiddingModal from "../../components/BiddingModal";
import JobCard from "../../components/JobCard";
import CategoryFilterModal from "../../components/RenderModal";
import i18n from "../../i18n";
import { filterData } from "../src/store/WorkData";
import {
  getCurrentAddress,
  getUserCoordinates,
} from "../src/store/locationUtils";
import { translateJobs } from "../src/store/translateService";
import { acceptWorkApi, getActiveWorkApi } from "../src/store/workService";

const WorkScreen = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [originalJobs, setOriginalJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: "",
    maxDistance: null,
    minEarning: null,
    jobType: null, // 'bidding' or 'fixed'
  });
  const [activeSort, setActiveSort] = useState(null);

  // --- BIDDING STATE ---
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // --- FILTER STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [currentOptions, setCurrentOptions] = useState(filterData.price);
  const [liveLocation, setLiveLocation] = useState("Fetching location...");

  useFocusEffect(
    useCallback(() => {
      let intervalId;

      const checkActiveJob = async () => {
        const activeData = await getActiveWorkApi();
        console.log("Active Job data:", activeData);

        if (activeData) {
          clearInterval(intervalId);

          // NAVIGATE to Status Screen and pass the raw JSON string
          router.replace({
            pathname: "/src/screens/WorkStatusScreen",
            params: {
              workData: JSON.stringify(activeData), // Sending the whole object
            },
          });
        }
      };
      // Run immediately once
      checkActiveJob();

      // Then poll every 5 seconds
      intervalId = setInterval(checkActiveJob, 5000);

      // Cleanup on blur (screen change)
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }, []),
  );

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    const initializeLocation = async () => {
      const address = await getCurrentAddress();
      setLiveLocation(address || "Location Not Found");
    };

    initializeLocation();
    fetchJobs();
  }, []);

  // Re-translate jobs when language changes
  useEffect(() => {
    const handleLanguageChange = async () => {
      if (originalJobs.length > 0) {
        const translated = await translateJobs(originalJobs);
        setJobs(translated);
      }
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [originalJobs]);

  // --- 2. API CALLS ---
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

      console.log("Fetching jobs:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOriginalJobs(data);
        // Translate job fields if language is not English
        const translated = await translateJobs(data);
        setJobs(translated);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs(activeFilters);
  };

  // --- 3. HANDLE ACTIONS ---

  // ACTION A: Accept Work (Existing Logic)
  const handleAcceptWork = (workId) => {
    Alert.alert(
      t("labourer.confirmAccept") || "Confirm Acceptance",
      t("labourer.oneJobLimitNote") || "You won't be able to accept other jobs until you complete this job. Do you want to proceed?",
      [
        { text: t("common.cancel") || "Cancel", style: "cancel" },
        { 
          text: t("common.yes") || "Yes, Accept", 
          onPress: () => processAcceptWork(workId) 
        }
      ]
    );
  };

  const processAcceptWork = async (workId) => {
    setLoading(true);
    try {
      // Call the generalized API function
      const acceptedWorkData = await acceptWorkApi(workId);

      Alert.alert(t('common.success'), t('labourer.workAccepted'));

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


  // --- 4. FILTERS & SORTING ---
  const handleFilterSelection = async (label) => {
    setModalVisible(false);

    // 0. Handle Clearing Options
    if (label === t("filterAndSort.clearSort", "Clear Sort")) {
      setActiveSort(null);
      return;
    }
    if (label === t("filterAndSort.clearFilter", "Clear Filter")) {
      const resetFilters = {
        category: "",
        maxDistance: null,
        minEarning: null,
        jobType: null,
      };
      setActiveFilters(resetFilters);
      setLoading(true);
      fetchJobs(resetFilters);
      return;
    }

    // 1. Handle Sorting Selection
    if (
      label === t("filterAndSort.distanceNearest", "Distance (Nearest)") ||
      label === t("filterAndSort.priceLowToHigh", "Price (Low to High)") ||
      label === t("filterAndSort.priceHighToLow", "Price (High to Low)")
    ) {
      setActiveSort(label);
      return;
    }

    // 2. Handle Job Type Filter
    if (label === t("filterAndSort.biddingOnly", "Bidding Allowed Only")) {
      setActiveFilters({ ...activeFilters, jobType: "bidding" });
      return;
    }
    if (label === t("filterAndSort.fixedPriceOnly", "Fixed Price Only")) {
      setActiveFilters({ ...activeFilters, jobType: "fixed" });
      return;
    }

    // 3. Handle Distance Selection
    console.log("Filter label ", label);
    const distanceMatch = label.match(/\d+/);
    console.log("Filter label ", distanceMatch);
    if (!distanceMatch) return;

    const distanceValue = parseInt(distanceMatch[0]);
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
        Alert.alert(t('labourer.locationError'), t('labourer.couldNotGetLocation'));
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const getSortedJobs = () => {
    let finalJobs = [...jobs];

    // Filter by Job Type First
    if (activeFilters.jobType === "bidding") {
      finalJobs = finalJobs.filter((job) => job.isBiddingAllowed);
    } else if (activeFilters.jobType === "fixed") {
      finalJobs = finalJobs.filter((job) => !job.isBiddingAllowed);
    }

    if (activeSort === t("filterAndSort.distanceNearest", "Distance (Nearest)")) {
      finalJobs.sort((a, b) => {
        const distA = parseFloat(a.distance || 0);
        const distB = parseFloat(b.distance || 0);
        return distA - distB;
      });
    } else if (activeSort === t("filterAndSort.priceLowToHigh", "Price (Low to High)")) {
      finalJobs.sort((a, b) => {
        const priceA = parseFloat(a.budget || a.salary || 0);
        const priceB = parseFloat(b.budget || b.salary || 0);
        return priceA - priceB;
      });
    } else if (activeSort === t("filterAndSort.priceHighToLow", "Price (High to Low)")) {
      finalJobs.sort((a, b) => {
        const priceA = parseFloat(a.budget || a.salary || 0);
        const priceB = parseFloat(b.budget || b.salary || 0);
        return priceB - priceA;
      });
    }

    return finalJobs;
  };

  const filteredJobs = getSortedJobs();

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
        title={t('labourer.selectDistance')}
      />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>{t('labourer.selectWork')}</Text>
            <View style={styles.locationPill}>
              <Icon name="location-outline" size={16} color="#000" />
              <Text style={styles.locationText}>
                {liveLocation.length > 25
                  ? liveLocation.substring(0, 25) + "..."
                  : liveLocation}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="notifications" size={24} color="#000" />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setCurrentOptions([
                { id: "clear_f", label: t("filterAndSort.clearFilter", "Clear Filter"), color: "#666" },
                { id: "fb1", label: t("filterAndSort.biddingOnly", "Bidding Allowed Only"), color: "#8E24AA" },
                { id: "fb2", label: t("filterAndSort.fixedPriceOnly", "Fixed Price Only"), color: "#E65100" },
                ...filterData.distance
              ]);
              setModalVisible(true);
            }}
          >
            <Icon name="filter-outline" size={20} color="#0D47A1" />
            <Text style={styles.actionButtonText}>
              {t("filterAndSort.filterBy", "Filter By")}
            </Text>
            {(activeFilters.maxDistance || activeFilters.jobType) && (
              <View style={styles.activeDot} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setCurrentOptions([
                { id: "clear_s", label: t("filterAndSort.clearSort", "Clear Sort"), color: "#666" },
                { id: "s1", label: t("filterAndSort.distanceNearest", "Distance (Nearest)"), color: "#0D47A1" },
                { id: "s2", label: t("filterAndSort.priceLowToHigh", "Price (Low to High)"), color: "#2ecc71" },
                { id: "s3", label: t("filterAndSort.priceHighToLow", "Price (High to Low)"), color: "#e74c3c" },
              ]);
              setModalVisible(true);
            }}
          >
            <Icon name="swap-vertical" size={20} color="#0D47A1" />
            <Text style={styles.actionButtonText}>
              {t("filterAndSort.sortBy", "Sort By")}
            </Text>
            {activeSort && (
              <View style={styles.activeDot} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#FF9F43"
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={{ paddingBottom: 50 }}
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
                onAccept={() => handleAcceptWork(job.id)}
                mainText={job.isBiddingAllowed ? t('labourer.bidNow') : t('labourer.accept')}
                onPressAction={(job) => {
                  setSelectedJob(job);
                  setBidModalVisible(true);
                }}
              />
            ))
          ) : (
            <Text style={styles.noJobsText}>{t('labourer.noJobsFound')}</Text>
          )}
        </ScrollView>
      )}

      {/* --- BIDDING MODAL --- */}
      <BiddingModal
        visible={bidModalVisible}
        onClose={() => setBidModalVisible(false)}
        job={selectedJob}
        onSuccess={() => {
          // Optional: refresh jobs or update UI after successful bid
          fetchJobs(activeFilters);
        }}
      />
    </SafeAreaView>
  );
};

// --- STYLES ---
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
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  actionButtonText: {
    marginLeft: 8,
    color: "#0D47A1",
    fontWeight: "bold",
    fontSize: 15,
  },
  activeDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: "red",
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  noJobsText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 16,
  },


});

export default WorkScreen;
