import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function EmployerTabLayout() {
  const { t } = useTranslation();
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
            title: t('tabs.myAds'),
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
          }}
        />
      <Tabs.Screen
        name="PostNewWorkScreen"
        options={{
          title: t('tabs.postJob'),
          tabBarIcon: ({ color }) => <MaterialIcons name="post-add" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}