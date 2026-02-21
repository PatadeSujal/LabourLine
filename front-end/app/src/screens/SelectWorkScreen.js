import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useState } from "react"; // Removed useEffect
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const SelectWorkScreen = () => {
  const params = useLocalSearchParams();

  // --- FIX START: Initialize State Directly (Lazy Initialization) ---
  // This replaces the useEffect completely and prevents the "Maximum update depth" error.

  const [categoryTitle] = useState(params.categoryName || "Select Work");

  // We use a function () => ... inside useState to parse the JSON only once
  const [subRoles] = useState(() => {
    if (params.subCategories) {
      try {
        return JSON.parse(params.subCategories);
      } catch (e) {
        console.error("Error parsing data:", e);
        return [];
      }
    }
    return [];
  });
  // --- FIX END ---

  const [selectedJobs, setSelectedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const tagColors = [
    "#D980FA",
    "#FF4757",
    "#FF9F43",
    "#FBC531",
    "#54A0FF",
    "#006266",
    "#FF4757",
    "#00CEC9",
  ];

  const toggleSelection = (id) => {
    if (selectedJobs.includes(id)) {
      setSelectedJobs(selectedJobs.filter((jobId) => jobId !== id));
    } else {
      setSelectedJobs([...selectedJobs, id]);
    }
  };

  const handleNextPress = async () => {
    if (selectedJobs.length === 0) return;

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not authenticated. Please login again.");
        setIsLoading(false);
        return;
      }

      // NOTE: Ensure your token has 'id' or 'userId'. Check your backend login response if this fails.
      const decoded = jwtDecode(token);
      const labourId = decoded.id || decoded.userId;

      if (!labourId) {
        Alert.alert("Error", "Invalid Token: ID not found.");
        setIsLoading(false);
        return;
      }

      // Create the space-separated string
      const skillsString = subRoles
        .filter((role) => selectedJobs.includes(role.id))
        .map((role) => role.label)
        .join(" ");

      console.log("Sending Skills:", skillsString);

      // Replace with your IP
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/labour/${labourId}/skills`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "text/plain",
            Authorization: `Bearer ${token}`,
          },
          body: skillsString,
        },
      );

      if (response.ok) {
        router.replace("/(worker)/WorkScreen");
      } else {
        const errorText = await response.text();
        Alert.alert("Update Failed", errorText || "Could not update skills");
      }
    } catch (error) {
      console.error("Network request failed:", error);
      Alert.alert("Error", "Network request failed. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <ImageBackground
        source={require("../images/shram-bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headerText}>{categoryTitle}</Text>

          <View style={styles.tagsContainer}>
            {subRoles.length > 0 ? (
              subRoles.map((role, index) => {
                const isSelected = selectedJobs.includes(role.id);
                const buttonColor = tagColors[index % tagColors.length];

                return (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.jobButton,
                      { backgroundColor: buttonColor },
                      isSelected && styles.selectedButton,
                    ]}
                    onPress={() => toggleSelection(role.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>{role.label}</Text>
                    {isSelected && (
                      <View style={styles.iconContainer}>
                        <Icon name="check" size={18} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={{ color: "#666", fontSize: 16 }}>
                No sub-categories found.
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              {
                backgroundColor:
                  selectedJobs.length > 0 ? "#FF4757" : "#bdc3c7",
              },
            ]}
            onPress={handleNextPress}
            disabled={selectedJobs.length === 0 || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>Next</Text>
                <Icon name="arrow-forward" size={24} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: "100%", height: "100%" },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 80,
    paddingBottom: 100,
    alignItems: "center",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 30,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  jobButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    margin: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedButton: {
    borderWidth: 3,
    borderColor: "#fff",
    paddingVertical: 9,
    paddingHorizontal: 17,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  iconContainer: {
    marginLeft: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
  },
  nextButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#FF4757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 10,
  },
});

export default SelectWorkScreen;
