import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const LoginScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [phoneNo, setPhoneNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  console.log(`${process.env.EXPO_PUBLIC_FRONTEND_API_URL}`);

  const handleSignup = () => {
    router.push("/src/screens/CreateAccountScreen");
  };

  const handleLogin = async () => {
    if (!phoneNo || !password) {
      Alert.alert(t('auth.inputError'), t('auth.pleaseEnterPhoneAndPassword'));
      return;
    }

    setLoading(true);
    // Ensure this IP is exactly what your laptop shows in ipconfig/ifconfig
    const API_URL = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/auth/login`;
    console.log(`${process.env.EXPO_PUBLIC_FRONTEND_API_URL}`);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNo: phoneNo,
          password: password,
        }),
      });

      const responseText = await response.text();

      if (response.ok) {
        let token = "";
        try {
          const data = JSON.parse(responseText);
          token = data.token || responseText;
        } catch (e) {
          token = responseText;
        }

        await AsyncStorage.setItem("userToken", token);

        const decoded = jwtDecode(token);
        // Note: Check if your backend uses 'role' or 'ROLE' or 'roles'
        const userRole = decoded.role;

        if (userRole === "LABOUR") {
          // Navigates to the worker group
          router.replace("/(worker)/WorkScreen");
        } else if (userRole === "EMPLOYER") {
          // Navigates to the employer group
          router.replace("/(employer)/PostNewWorkScreen");
        } else {
          Alert.alert(t('auth.roleError'), t('auth.noValidRole'));
        }
      } else {
        Alert.alert(t('auth.loginFailed'), t('auth.invalidCredentials'));
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert(t('auth.networkError'), t('auth.cannotConnectServer'));
    } finally {
      setLoading(false);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
              <Text style={styles.headerText}>{t('auth.welcomeBack')}</Text>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.phoneNumber')}
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  value={phoneNo}
                  onChangeText={setPhoneNo}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.login')}</Text>
                )}
              </TouchableOpacity>

              {/* Sign Up Link */}
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={handleSignup}
              >
                <Text style={styles.linkText}>
                  {t('auth.dontHaveAccount')}
                  <Text style={styles.linkHighlight}>{t('auth.signup')}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: "100%", height: "100%" },
  keyboardView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Glassmorphism effect
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF5E57", // Matches the red theme
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#FF4757", // Distinct Red color
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#FF4757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkContainer: { marginTop: 20 },
  linkText: { color: "#666", fontSize: 14 },
  linkHighlight: { color: "#FF4757", fontWeight: "bold" },
});

export default LoginScreen;

