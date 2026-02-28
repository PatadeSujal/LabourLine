import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
  const handleCreateAcc = () => {
    router.push({
      pathname: "/src/screens/OtpScreen",
      params: {
        name: name, // assuming these are state variables in your current screen
        age: age,
        phoneNo: phone,
        password,
      },
    });
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
              <Text style={styles.headerText}>{t('auth.createAccount')}</Text>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enterName')}
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              {/* Age Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enterAge')}
                  placeholderTextColor="#666"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enterPhone')}
                  placeholderTextColor="#666"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enterPassword')}
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
                style={styles.primaryButton}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{t('auth.createAccount')}</Text>
              </TouchableOpacity>
              {/* Login Link */}
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={handleLogin}
              >
                <Text style={styles.linkText}>
                  {t('auth.alreadyHaveAccount')}
                  <Text style={styles.linkHighlight}>{t('auth.login')}</Text>
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

export default CreateAccountScreen;
