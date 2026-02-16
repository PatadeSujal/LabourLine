import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router"; // Import useRouter hook
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const LoginScreen = () => {
  const router = useRouter(); // Hook to handle navigation
  const [phoneNo, setPhoneNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  console.log(`${process.env.EXPO_PUBLIC_FRONTEND_API_URL}`);
  const handleLogin = async () => {
    if (!phoneNo || !password) {
      Alert.alert("Input Error", "Please enter phone number and password");
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
          Alert.alert("Role Error", "No valid role found in token");
        }
      } else {
        Alert.alert("Login Failed", "Invalid credentials or Server error");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Network Error", "Cannot connect to server. Check your IP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={phoneNo}
        onChangeText={setPhoneNo}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    color: "#FF9F43",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#FF9F43",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoginScreen;
