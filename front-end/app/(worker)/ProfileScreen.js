import { Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import CategoryFilterModal from "../../components/RenderModal";
import i18n from "../../i18n";

const ProfileScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const params = useLocalSearchParams();

  const languages = [
    { id: "1", label: "English", color: "#4E342E", code: "en" },
    { id: "2", label: "हिंदी", color: "#FF5E57", code: "hi" },
    { id: "3", label: "मराठी", color: "#FF9F43", code: "mr" },
    { id: "4", label: "മലയാളം", color: "#D980FA", code: "ml" },
    { id: "5", label: "ਪੰਜਾਬੀ", color: "#FBC531", code: "pa" },
    { id: "6", label: "தமிழ்", color: "#9C88FF", code: "ta" },
    { id: "7", label: "తెలుగు", color: "#8BC34A", code: "te" },
    { id: "8", label: "ಕನ್ನಡ", color: "#00D2D3", code: "kn" },
    { id: "9", label: "অসমীয়া", color: "#54A0FF", code: "as" },
    { id: "10", label: "اردو", color: "#FFC048", code: "ur" },
  ];

  const handleLanguageSelect = (label) => {
    const selected = languages.find((lang) => lang.label === label);
    if (selected) {
      i18n.changeLanguage(selected.code);
    }
    setLangModalVisible(false);
  };
  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        router.replace("/LoginScreen");
        return;
      }

      // Extract User ID from Token
      const decoded = jwtDecode(token);
      const userId = decoded.id;

      // Use your machine's IP address (e.g., 10.198.221.175)
      const API_URL = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/user/${userId}/labour-profile`;

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        Alert.alert(t('common.error'), t('labourer.fetchProfileError'));
      }
    } catch (error) {
      console.error("Profile Fetch Error:", error);
      Alert.alert(t('auth.networkError'), t('labourer.unableToConnect'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    router.replace("/src/screens/LoginScreen");
  };
  const handleAddSkills = () => {
    router.push("/src/screens/SelectCategoryScreen");
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF9F43" />
      </View>
    );
  }

  // Convert comma-separated skills string into an array
  const skillsArray = profile?.skills ? profile.skills.split(",") : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: "https://via.placeholder.com/150" }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>
            {params.name || profile?.user?.name}
          </Text>
          <Text style={styles.userLocation}>{t('profile.puneLocation')}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {profile?.rating?.toFixed(1) || "0.0"}
            </Text>
            <Text style={styles.statLabel}>{t('profile.rating')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.jobsDone || "0"}</Text>
            <Text style={styles.statLabel}>{t('profile.jobsDone')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {profile?.experience || "0"} Yr
            </Text>
            <Text style={styles.statLabel}>{t('profile.experience')}</Text>
          </View>
        </View>

        {/* Services Section */}
        <Text style={styles.sectionTitle}>{t('profile.skillsAndServices')}</Text>
        <View style={styles.servicesContainer}>
          {skillsArray.length > 0 ? (
            skillsArray.map((skill, index) => (
              <View key={index} style={styles.serviceChip}>
                <Text style={styles.serviceText}>{skill.trim()}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>{t('profile.noSkillsAdded')}</Text>
          )}
          <TouchableOpacity
            style={styles.addServiceButton}
            onPress={handleAddSkills}
          >
            <Text style={styles.addServiceText}>{t('profile.add')}</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Section */}
        <View style={styles.earningCard}>
          <Text style={styles.earningLabel}>{t('profile.totalEarnings')}</Text>
          <Text style={styles.earningValue}>
            ₹ {profile?.totalEarnings || "0"}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setLangModalVisible(true)}>
            <Text style={styles.actionButtonText}>
              {t('profile.languageLabel', { language: profile?.language || 'English' })}
            </Text>
            <MaterialIcons name="translate" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Text style={styles.actionButtonText}>{t('profile.logOut')}</Text>
            <Feather name="log-out" size={24} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <CategoryFilterModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
        categories={languages}
        onSelect={handleLanguageSelect}
        title={t('languageSelection.title')}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  // Header Styles
  header: {
    alignItems: "center",
    marginBottom: 25,
    marginTop: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    backgroundColor: "#ddd",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  userLocation: {
    fontSize: 14,
    color: "#888",
  },
  // Stats Styles
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#f8f9fa",
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 25,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#ddd",
    height: "80%",
    alignSelf: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 15,
    color: "#000",
  },
  // Services Styles
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "flex-start",
    marginBottom: 30,
  },
  serviceChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  serviceText: {
    color: "#333",
    fontWeight: "600",
  },
  addServiceButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#888",
    borderStyle: "dashed",
    marginBottom: 10,
  },
  addServiceText: {
    color: "#888",
    fontWeight: "600",
  },
  // Action Buttons Styles
  actionsContainer: {
    width: "100%",
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FF9F43", // Orange border color
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    color: "#888",
    fontStyle: "italic",
    marginRight: 10,
  },
  earningCard: {
    width: "100%",
    backgroundColor: "#FF9F43",
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  earningValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
