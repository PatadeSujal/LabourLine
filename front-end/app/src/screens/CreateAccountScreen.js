
import { router } from "expo-router";
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

const CreateAccountScreen = () => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateAcc = async () => {
    // Validate inputs
    if (!name || !age || !phone || !password) {
      Alert.alert(
        t("common.error"),
        t("auth.fillAllFields") || "Please fill in all fields"
      );
      return;
    }

    if (phone.length < 10) {
      Alert.alert(
        t("common.error"),
        t("auth.invalidPhone") || "Please enter a valid 10-digit phone number"
      );
      return;
    }

    setLoading(true);

    try {
      // Skip Firebase OTP and navigate directly to OTP screen
      // We no longer pass verificationId since it's a mock verification
      router.push({
        pathname: "/src/screens/OtpScreen",
        params: {
          name: name,
          age: age,
          phoneNo: phone,
          password: password,
        },
      });
    } catch (error) {
      console.error("Navigation Error:", error);
      Alert.alert(t("common.error"), "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push("/src/screens/LoginScreen");
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
              <Text style={styles.headerText}>{t("auth.createAccount")}</Text>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.enterName")}
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              {/* Age Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.enterAge")}
                  placeholderTextColor="#666"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    placeholder={t("auth.enterPhone")}
                    placeholderTextColor="#666"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>
              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.enterPassword")}
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  keyboardType="visible-password"
                  maxLength={10}
                />
              </View>
              {/* Action Button */}
              <TouchableOpacity
                onPress={handleCreateAcc}
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t("auth.createAccount")}
                  </Text>
                )}
              </TouchableOpacity>
              {/* Login Link */}
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={handleLogin}
              >
                <Text style={styles.linkText}>
                  {t("auth.alreadyHaveAccount")}
                  <Text style={styles.linkHighlight}>{t("auth.login")}</Text>
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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
    borderColor: "#FF5E57",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCodeBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF5E57",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  phoneInput: {
    flex: 1,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#FF4757",
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
  buttonDisabled: {
    opacity: 0.7,
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

export default CreateAccountScreen;
