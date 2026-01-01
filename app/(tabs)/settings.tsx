import { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform } from 'react-native';
import {
  Text,
  List,
  Switch,
  Divider,
  useTheme,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSefaria } from '@/contexts/SefariaContext';

export default function SettingsScreen() {
  const theme = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  const {
    index,
    topics,
    isCheckingForUpdates,
    dataSources,
    refreshData,
    resetToBundle,
  } = useSefaria();

  const handleRefreshData = async () => {
    await refreshData();
    if (Platform.OS === 'web') {
      alert('Data check complete!');
    } else {
      Alert.alert('Complete', 'Data update check complete.');
    }
  };

  const handleResetData = () => {
    const doReset = async () => {
      await resetToBundle();
      if (Platform.OS === 'web') {
        alert('Data reset to bundled version.');
      } else {
        Alert.alert('Complete', 'Data reset to bundled version.');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Reset data to bundled version? This will clear any cached updates.')) {
        doReset();
      }
    } else {
      Alert.alert(
        'Reset Data',
        'Reset data to bundled version? This will clear any cached updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: doReset },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Data Management Section */}
        <List.Section>
          <List.Subheader>Sefaria Data</List.Subheader>
          <List.Item
            title="Library Index"
            description={`${index?.length ?? 0} categories (${dataSources.index ?? 'loading'})`}
            left={(props) => <List.Icon {...props} icon="bookshelf" />}
          />
          <Divider />
          <List.Item
            title="Topics"
            description={`${(topics?.length ?? 0).toLocaleString()} topics (${dataSources.topics ?? 'loading'})`}
            left={(props) => <List.Icon {...props} icon="tag-multiple" />}
          />
          <Divider />
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleRefreshData}
              disabled={isCheckingForUpdates}
              icon={isCheckingForUpdates ? undefined : 'refresh'}
              style={styles.dataButton}
            >
              {isCheckingForUpdates ? (
                <ActivityIndicator size={16} />
              ) : (
                'Check for Updates'
              )}
            </Button>
            <Button
              mode="outlined"
              onPress={handleResetData}
              disabled={isCheckingForUpdates}
              icon="restore"
              style={styles.dataButton}
            >
              Reset to Bundled
            </Button>
          </View>
        </List.Section>

        <List.Section>
          <List.Subheader>Preferences</List.Subheader>
          <List.Item
            title="Notifications"
            description="Receive push notifications"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Dark Mode"
            description="Use dark theme"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Analytics"
            description="Help improve the app"
            left={(props) => <List.Icon {...props} icon="chart-line" />}
            right={() => (
              <Switch
                value={analytics}
                onValueChange={setAnalytics}
              />
            )}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title="Profile"
            description="Manage your profile"
            left={(props) => <List.Icon {...props} icon="account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Privacy"
            description="Privacy settings"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Security"
            description="Password and authentication"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <Divider />
          <List.Item
            title="Terms of Service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="open-in-new" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Privacy Policy"
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            right={(props) => <List.Icon {...props} icon="open-in-new" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Open Source Licenses"
            left={(props) => <List.Icon {...props} icon="code-tags" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
        </List.Section>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Built with React Native & Expo
          </Text>
          <Text variant="bodySmall" style={styles.footerText}>
            Data provided by Sefaria.org
          </Text>
          <View style={styles.iconRow}>
            <MaterialCommunityIcons
              name="react"
              size={24}
              color={theme.colors.primary}
            />
            <MaterialCommunityIcons
              name="cellphone"
              size={24}
              color={theme.colors.primary}
            />
            <MaterialCommunityIcons
              name="web"
              size={24}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },
  dataButton: {
    flex: 1,
    minWidth: 140,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    opacity: 0.6,
    marginBottom: 8,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
});
