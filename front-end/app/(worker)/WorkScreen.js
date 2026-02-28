import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { jwtDecode } from "jwt-decode"; // Make sure to install: npm install jwt-decode
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Modal,
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

// COMPONENTS
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
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState([]);
  const [originalJobs, setOriginalJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: "",
    maxDistance: null,
    minEarning: null,
  });

  // --- BIDDING STATE ---
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidComment, setBidComment] = useState("");
  const [bidLoading, setBidLoading] = useState(false);

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
  const handleAcceptWork = async (workId) => {
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

  // ACTION B: Submit Bid (New Logic)
  const submitBid = async () => {
    if (!bidAmount) {
      Alert.alert(t('common.error'), t('labourer.pleaseEnterAmount'));
      return;
    }

    setBidLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const decoded = jwtDecode(token);
      const labourId = decoded.id; // Or however you store the ID

      const payload = {
        workId: selectedJob.id,
        labourId: labourId,
        bidAmount: parseFloat(bidAmount),
        comment: bidComment,
      };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/labour/bid`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        Alert.alert(t('common.success'), t('labourer.bidSent'));
        setBidModalVisible(false);
        setBidAmount("");
        setBidComment("");
      } else {
        const errText = await response.text();
        Alert.alert(t('common.error'), errText || t('labourer.failedToPlaceBid'));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('labourer.networkRequestFailed'));
    } finally {
      setBidLoading(false);
    }
  };

  // --- 4. FILTERS ---
  const handleFilterSelection = async (label) => {
    console.log("Filter label ", label);
    const distanceMatch = label.match(/\d+/);
    console.log("Filter label ", distanceMatch);
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
        Alert.alert(t('labourer.locationError'), t('labourer.couldNotGetLocation'));
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

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

        <View style={styles.searchContainer}>
          <Icon
            name="search-outline"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('labourer.searchJobs')}
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
                  setBidAmount(job.budget ? job.budget.toString() : "");
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={bidModalVisible}
        onRequestClose={() => setBidModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('labourer.placeYourBid')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('labourer.budgetLabel', { amount: selectedJob?.budget || selectedJob?.earning || 'N/A' })}
            </Text>

            <Text style={styles.label}>{t('labourer.yourOffer')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder={t('labourer.offerPlaceholder')}
              value={bidAmount}
              onChangeText={setBidAmount}
            />

            <Text style={styles.label}>{t('labourer.commentOptional')}</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              multiline
              placeholder={t('labourer.commentPlaceholder')}
              value={bidComment}
              onChangeText={setBidComment}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setBidModalVisible(false)}
              >
                <Text style={styles.btnTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnSubmit]}
                onPress={submitBid}
                disabled={bidLoading}
              >
                {bidLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnTextSubmit}>{t('labourer.sendBid')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  noJobsText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 16,
  },

  // --- MODAL STYLES (ADDED) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  btnCancel: {
    backgroundColor: "#eee",
  },
  btnSubmit: {
    backgroundColor: "#FF9F43",
  },
  btnTextCancel: {
    color: "#333",
    fontWeight: "bold",
  },
  btnTextSubmit: {
    color: "white",
    fontWeight: "bold",
  },
});

export default WorkScreen;
