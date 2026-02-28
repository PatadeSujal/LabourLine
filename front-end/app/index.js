import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useRootNavigationState } from "expo-router"; // <-- Import added
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import LanguageSelectionScreen from "./src/screens/LanguageSelection";

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);

  // 1. Get the current navigation state
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // 2. CRITICAL FIX: Do not run auth check until Expo Router is fully mounted
    if (!rootNavigationState?.key) return;

    checkAuthStatus();
  }, [rootNavigationState?.key]); // 3. Re-run this effect when the router becomes ready

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
