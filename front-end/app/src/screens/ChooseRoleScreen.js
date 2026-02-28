import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react"; // Added for loading state
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ChooseRoleScreen = ({ userDetails }) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const registerUser = async (selectedRole) => {
    setLoading(true);
    const API_URL = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/auth/register`;

    const payload = {
      phoneNo: params.phoneNo,
      name: params.name,
      age: params.age,
      password: params.password,
      role: selectedRole,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Correctly accessing 'token' from your JSON response
        if (data.token) {
          await AsyncStorage.setItem("userToken", data.token);
          console.log(data.token);
          console.log("Token stored successfully");
        }

        Alert.alert(t('common.success'), t('auth.accountCreated'));

        // 2. Use the 'role' directly from the response for better reliability
        if (data.role === "LABOUR") {
          router.replace("/src/screens/SelectCategoryScreen");
        } else {
          router.replace("/(employer)/PostNewWorkScreen");
        }
      } else {
        Alert.alert(
          t('auth.registrationFailed'),
          data.message || t('auth.somethingWentWrong'),
        );
      }
    } catch (error) {
      console.error("Registration Error:", error);
      Alert.alert(t('auth.networkError'), t('auth.checkServerConnection'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorker = () => {
    console.log("User selected: Labour");
    registerUser("LABOUR");
  };

  const handleSelectEmployer = () => {
    console.log("User selected: Employer");
    registerUser("EMPLOYER");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#FF9F43" />
        </View>
      )}

      <ImageBackground
        source={require("../images/shram-bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.contentContainer}>
          <Text style={styles.mainHeader}>{t('chooseRole.chooseOne')}</Text>

          <TouchableOpacity
            style={styles.optionContainer}
            activeOpacity={0.8}
            onPress={handleSelectWorker}
            disabled={loading}
          >
            <Text style={styles.optionLabel}>{t('chooseRole.wantWork')}</Text>
            <View style={styles.iconCircle}>
              <Image
                source={require("../images/worker_icon.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
            <Text style={styles.separatorText}>{t('chooseRole.or')}</Text>
          </View>

          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleSelectEmployer}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.optionLabel}>{t('chooseRole.giveWork')}</Text>
            <View style={[styles.iconCircle, styles.blueBorder]}>
              <Image
                source={require("../images/employer_icon.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  mainHeader: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 40,
    marginTop: 20,
  },
  optionContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  optionLabel: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 15, // Space between text and circle
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70, // Makes it a perfect circle
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  blueBorder: {
    borderWidth: 3,
    borderColor: "#00A8FF", // Matches the blue ring in the second option
  },
  iconImage: {
    width: "100%", // Icons take up 60% of the circle
    height: "100%",
    alignSelf: "center",
  },
  separatorContainer: {
    marginVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  separatorText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
});

export default ChooseRoleScreen;
