import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Market', tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} /> }}
      />
      <Tabs.Screen
        name="paper"
        options={{ title: 'Paper', tabBarIcon: ({ color }) => <TabBarIcon name="clipboard" color={color} /> }}
      />
      <Tabs.Screen
        name="live"
        options={{ title: 'Live', tabBarIcon: ({ color }) => <TabBarIcon name="bolt" color={color} /> }}
      />
      <Tabs.Screen
        name="research"
        options={{ title: 'Research', tabBarIcon: ({ color }) => <TabBarIcon name="flask" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} /> }}
      />
    </Tabs>
  );
}
