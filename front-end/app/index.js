import { View } from "react-native";
import LanguageSelectionScreen from "./src/screens/LanguageSelection";

export default function HomeScreen() {
  return (
    <>
      <View style={{ flex: 1 }}>
        <LanguageSelectionScreen />
      </View>
    </>
  );
}
