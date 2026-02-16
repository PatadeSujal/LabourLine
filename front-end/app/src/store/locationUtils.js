import * as Location from "expo-location";

/**
 * Function 1: Gets raw Latitude and Longitude
 */
export const getUserCoordinates = async () => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    let location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Coordinate Fetch Error:", error);
    return null;
  }
};

/**
 * Function 2: Gets human-readable address from coordinates
 */
export const getAddressFromCoords = async (latitude, longitude) => {
  try {
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (reverseGeocode.length > 0) {
      const addr = reverseGeocode[0];
      // Format: "Name/Street, City, Region"
      return `${addr.name || ""} ${addr.street || ""}, ${addr.city}, ${addr.region}`;
    }
    return "Address not found";
  } catch (error) {
    console.error("Error getting address:", error);
    return null;
  }
};
export const getCurrentAddress = async () => {
  try {
    // Step 1: Get raw coordinates
    const coords = await getUserCoordinates();

    if (!coords) {
      console.warn("Could not retrieve coordinates");
      return null;
    }

    // Step 2: Convert coordinates to address string
    const address = await getAddressFromCoords(
      coords.latitude,
      coords.longitude,
    );

    return address || "Unknown Location";
  } catch (error) {
    console.error("Generalize Location Error:", error);
    return null;
  }
};
const deg2rad = (deg) => deg * (Math.PI / 180);
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return "0";

  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d.toFixed(1);
};
