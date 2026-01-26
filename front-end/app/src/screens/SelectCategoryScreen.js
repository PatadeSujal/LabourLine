import { router } from "expo-router";
import {
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 1. IMPORT YOUR DATA HERE
import { workCategories } from "../../src/store/WorkData";

const SelectCategoryScreen = () => {
  const handleCategorySelect = (category) => {
    // 2. PASS DATA TO NEXT SCREEN
    // We pass the specific subCategories for the clicked item
    router.push({
      pathname: "/src/screens/SelectWorkScreen", // Ensure this matches your file name exactly
      params: {
        categoryName: category.label,
        // Convert the array to a string to pass it safely
        subCategories: JSON.stringify(category.subCategories),
      },
    });
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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Select Work</Text>
            <Text style={styles.headerText}>Category</Text>
          </View>

          <View style={styles.listContainer}>
            {/* 3. GENERATE BUTTONS DYNAMICALLY */}
            {workCategories.map((item) => (
              <TouchableOpacity
                key={item.id}
                // Use the specific color defined in your data
                style={[styles.categoryButton, { backgroundColor: item.color }]}
                onPress={() => handleCategorySelect(item)}
                activeOpacity={0.8}
              >
                {/* Use the specific label defined in your data */}
                <Text style={styles.buttonText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: "100%", height: "100%" },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  headerContainer: { marginBottom: 40, alignItems: "center" },
  headerText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    lineHeight: 40,
  },
  listContainer: { width: "100%", alignItems: "center" },
  categoryButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default SelectCategoryScreen;
