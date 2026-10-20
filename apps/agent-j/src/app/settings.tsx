import { Stack } from 'expo-router';

import { SettingsScreen } from '@/components/SettingsScreen';

export default function Settings() {
  return (
    <>
      <Stack.Screen options={{ title: 'Einstellungen' }} />
      <SettingsScreen />
    </>
  );
}
