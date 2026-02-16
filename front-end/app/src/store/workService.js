import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

export const acceptWorkApi = async (workId) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated");

    const decoded = jwtDecode(token);
    const labourId = decoded.id;

    const API_URL = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/labour/accept-work?labourId=${labourId}&workId=${workId}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Could not accept work.");
    }

    return await response.json();
  } catch (error) {
    console.error("Generalized Accept Work Error:", error);
    throw error;
  }
};
