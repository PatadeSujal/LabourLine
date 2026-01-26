import { router } from "expo-router";
import {
  Dimensions,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const { width } = Dimensions.get("window");
const handleLanguageSelect = (lang) => {
  console.log("Selected:", lang.label);
  // Navigate to the Create Account screen
  router.push("/create-account");
};
const LanguageSelectionScreen = () => {
  // Data array for languages with specific colors matching the design
  const languages = [
    { id: "1", label: "हिंदी", color: "#FF5E57" }, // Red/Coral
    { id: "2", label: "मराठी", color: "#FF9F43" }, // Orange
    { id: "3", label: "മലയാളം", color: "#D980FA" }, // Light Purple
    { id: "4", label: "ਪੰਜਾਬੀ", color: "#FBC531" }, // Yellow
    { id: "5", label: "தமிழ்", color: "#9C88FF" }, // Periwinkle/Purple
    { id: "6", label: "తెలుగు", color: "#8BC34A" }, // Green
    { id: "7", label: "اردو", color: "#FFC048" }, // Peach/Gold
    { id: "8", label: "ಕನ್ನಡ", color: "#00D2D3" }, // Cyan/Teal
    { id: "9", label: "অসমীয়া", color: "#54A0FF" }, // Blue
    { id: "10", label: "English", color: "#4E342E" }, // Dark Brown
  ];

  const handleLanguageSelect = (language) => {
    console.log(`Selected Language: ${language.label}`);
    router.push("/src/screens/CreateAccountScreen");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* Background Image */}
      <ImageBackground
        source={require("../images/shram-bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Main Content Container */}
        <View style={styles.contentContainer}>
          {/* Header Title */}
          <Text style={styles.headerText}>
            Language / <Text style={styles.hindiHeader}>भाषा</Text>
          </Text>

          {/* Grid of Language Buttons */}
          <View style={styles.gridContainer}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[styles.languageButton, { backgroundColor: lang.color }]}
                onPress={() => handleLanguageSelect(lang)}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60, // Space for status bar/top notch
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 40, // Space between title and buttons
    textAlign: "center",
  },
  hindiHeader: {
    // Specifically ensuring the Hindi font weight matches the design
    fontWeight: "bold",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Spreads columns apart
    width: "100%",
    maxWidth: 340, // Prevents buttons from getting too wide on tablets
  },
  languageButton: {
    width: "46%", // Approx half width minus margin
    height: 55,
    borderRadius: 30, // High border radius for pill/capsule shape
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20, // Vertical spacing between rows

    // Shadow for depth (optional, matches the flat-ish but elevated look)
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default LanguageSelectionScreen;
