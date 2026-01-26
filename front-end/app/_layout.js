import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen
        name="src/screens/CreateAccountScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="src/screens/LoginScreen"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="src/screens/OtpScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="src/screens/ChooseRoleScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="src/screens/SelectCategoryScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="src/screens/SelectWorkScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="src/screens/EmployerWorkStatus"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="(worker)"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="(employer)"
        options={{
          headerShown: false,
          gestureEnabled: false, // Prevents swiping back to login
        }}
      />
    </Stack>
  );
}
