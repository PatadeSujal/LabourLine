
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);
  const params = useLocalSearchParams();



  const handleOtpVerification = async () => {
    const code = otp.join("");

    // Basic Validation: Ensure 6 digits are entered
    if (code.length !== 6) {
      Alert.alert(t("common.error"), t("otp.enterFullCode"));
      return;
    }

    setLoading(true);

    try {
      // Mock verification delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // OTP verified successfully (mocked: accepts any 6 digits)
      // Navigate to role selection
      router.push({
        pathname: "/src/screens/ChooseRoleScreen",
        params: {
          name: params.name,
          phoneNo: params.phoneNo,
          age: params.age,
          password: params.password,
        },
      });
    } catch (error) {
      console.error("OTP Verification Error:", error);
      Alert.alert(t("common.error"), "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
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

  const handleResend = async () => {
    setResending(true);
    try {
      // Mock resend delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Clear the OTP inputs
      setOtp(["", "", "", "", "", ""]);

      Alert.alert(
        t("common.success") || "Success",
        t("otp.resendSuccess") || "A new OTP has been sent to your phone."
      );
    } catch (error) {
      console.error("Resend OTP Error:", error);
      Alert.alert(
        t("common.error"),
        error.message || "Failed to resend OTP. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  // Mask the phone number for display: ******7890
  const maskedPhone = params.phoneNo
    ? `******${params.phoneNo.slice(-4)}`
    : "";

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
            <Text style={styles.headerText}>{t("otp.enterOtp")}</Text>
            <Text style={styles.subText}>
              {t("otp.otpSentTo") || "OTP sent to"} +91 {maskedPhone}
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  textAlign="center"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.buttonDisabled]}
              onPress={handleOtpVerification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {t("otp.verifyAndProceed")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={handleResend}
              disabled={resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#FF4757" />
              ) : (
                <Text style={styles.resendText}>
                  {t("otp.didntReceiveCode")}
                  <Text style={styles.resendHighlight}>
                    {t("otp.resend")}
                  </Text>
                </Text>
              )}
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
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#fff",
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: "#FF4757",
  },
  verifyButton: {
    width: "100%",
    backgroundColor: "#FF4757",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  resendContainer: { marginTop: 20, minHeight: 30, justifyContent: "center" },
  resendText: { color: "#666" },
  resendHighlight: { color: "#FF4757", fontWeight: "bold" },
});

export default OtpScreen;
