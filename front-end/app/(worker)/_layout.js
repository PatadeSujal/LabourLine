import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useRouter, useSegments } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments(); // To check current route
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkActiveWork();
  }, []);

  const checkActiveWork = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const decoded = jwtDecode(token);
      const labourId = decoded.id;

      const response = await fetch(
        `http://10.62.29.175:8080/labour/active-work/${labourId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 200) {
        const workData = await response.json();

        router.replace({
          pathname: "/src/screens/WorkStatusScreen",
          params: { workData: JSON.stringify(workData) },
        });
      }
      // If 204 No Content, do nothing (let them see tabs)
    } catch (error) {
      console.error("Status Check Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF4757" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF4757",
        tabBarStyle: { height: 60, paddingBottom: 10 },
      }}
    >
      <Tabs.Screen
        name="WorkScreen"
        options={{
          title: "Find Work",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="work" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="MapsScreen"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="map" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
