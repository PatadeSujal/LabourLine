import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function EmployerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1B1464', // Navy Blue for Employers (Distinct look)
        tabBarStyle: { height: 60, paddingBottom: 10 },
      }}
    >
        <Tabs.Screen
          name="YouPostedScreen"
          options={{
            title: 'My Ads',
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
          }}
        />
      <Tabs.Screen
        name="PostNewWorkScreen"
        options={{
          title: 'Post Job',
          tabBarIcon: ({ color }) => <MaterialIcons name="post-add" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}