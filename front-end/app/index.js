import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import LanguageSelectionScreen from "./src/screens/LanguageSelection";

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (token) {
        // Decode the token to get the role
        const decoded = jwtDecode(token);
        const userRole = decoded.role; // Ensure your JWT has a 'role' field

        if (userRole === "EMPLOYER") {
          router.replace("/(employer)/PostNewWorkScreen"); // Adjust paths to your file structure
        } else if (userRole === "LABOUR") {
          router.replace("/(worker)/WorkScreen");
        }
      }
    } catch (error) {
      console.error("Auth Check Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a loading spinner while checking storage
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
    );
  }

  // If no token, show the initial onboarding screen
  return (
    <View style={{ flex: 1 }}>
      <LanguageSelectionScreen />
    </View>
  );
}
