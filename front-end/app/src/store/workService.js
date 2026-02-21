import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
export const confirmBidApi = async (bidId) => {
  console.log("This is bid ", bidId);
  try {
    const token = await AsyncStorage.getItem("userToken");

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/confirm-bid/${bidId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    // 1. SAFELY READ THE RESPONSE
    const text = await response.text();
    console.log("Raw Server Response:", text); // <--- This will tell you exactly what Spring Boot sent back

    // 2. PARSE ONLY IF NOT EMPTY
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("API Error in confirmBidApi:", error);
    throw error;
  }
};

export const acceptWorkApi = async (workId, labourIdOverride = null) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated");

    let labourId;

    if (labourIdOverride) {
      // CASE 1: Employer is assigning the job (We use the ID passed from the Bid)
      console.log("Using provided Labour ID:", labourIdOverride);
      labourId = labourIdOverride;
    } else {
      // CASE 2: Labour is accepting the job (We get ID from their Token)
      const decoded = jwtDecode(token);
      labourId = decoded.id;
    }

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
    console.error("Accept Work Error:", error);
    throw error;
  }
};

export const getActiveWorkApi = async () => {
  console.log("--- 1. STARTING ACTIVE WORK CHECK ---");

  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      console.log("❌ Error: No Token Found");
      return null;
    }

    const decoded = jwtDecode(token);
    const labourId = decoded.id; // Ensure this matches your token structure

    // DEBUG: Check if ID is valid
    if (!labourId) {
      console.error("❌ Error: Labour ID is undefined in token!");
      return null;
    }
    console.log("✅ Labour ID from Token:", labourId);

    // Construct URL
    const url = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/labour/active-work/${labourId}`;
    console.log("✅ Fetching URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ Response Status:", response.status);

    // CASE 1: No Content (204)
    if (response.status === 204) {
      console.log("ℹ️ Status 204: Server says No Active Work");
      return null;
    }

    // CASE 2: Success (200)
    if (response.ok) {
      // IMPORTANT: Read text first to debug JSON errors
      const textData = await response.text();
      console.log("✅ Raw Response Body:", textData);

      try {
        const jsonData = JSON.parse(textData);
        return jsonData;
      } catch (e) {
        console.error(
          "❌ JSON Parse Error. Backend returned invalid JSON:",
          textData,
        );
        return null;
      }
    }

    // CASE 3: Error (400, 404, 500)
    else {
      const errorText = await response.text();
      console.log("❌ Server Error Response:", errorText);
      return null;
    }
  } catch (error) {
    console.error("❌ CRITICAL EXCEPTION in getActiveWorkApi:", error);
    return null;
  }
};
