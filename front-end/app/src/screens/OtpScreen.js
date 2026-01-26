import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const OtpScreen = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const params = useLocalSearchParams();
  const handleOtpVerification = async () => {
    const code = otp.join("");

    // Basic Validation: Ensure 6 digits are entered
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the full 6-digit code");
      return;
    }

    setLoading(true);

    router.push(
      {
        pathname: "/src/screens/ChooseRoleScreen",
        params: {
          name: params.name,
          phoneNo: params.phoneNo,
          age: params.age,
          password: params.password,
        },
      },
      1000,
    );
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-focus previous input on backspace
    if (text.length === 0 && index > 0) {
      inputRefs.current[index - 1].focus();
    }

    // Auto dismiss keyboard at last digit
    if (index === 5 && text.length === 1) {
      Keyboard.dismiss();
    }
  };

  const handleResend = () => {
    Alert.alert("Resend OTP", "This is a demo. No code was sent.");
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
        <View style={styles.contentContainer}>
          <View style={styles.card}>
            <Text style={styles.headerText}>Enter OTP</Text>
            <Text style={styles.subText}>
              (Demo Mode) Enter any 6 digits to proceed
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpBox}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  textAlign="center"
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleOtpVerification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify & Proceed</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={handleResend}
            >
              <Text style={styles.resendText}>
                Didn't receive code?{" "}
                <Text style={styles.resendHighlight}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: "100%", height: "100%" },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    elevation: 8,
  },
  headerText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },
  otpBox: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: "#FF4757",
    borderRadius: 8,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#fff",
    elevation: 2,
  },
  verifyButton: {
    width: "100%",
    backgroundColor: "#FF4757",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  resendContainer: { marginTop: 20 },
  resendText: { color: "#666" },
  resendHighlight: { color: "#FF4757", fontWeight: "bold" },
});

export default OtpScreen;
