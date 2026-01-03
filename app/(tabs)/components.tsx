import { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform, useWindowDimensions } from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Checkbox,
  RadioButton,
  Switch,
  Chip,
  FAB,
  IconButton,
  SegmentedButtons,
  Divider,
  Surface,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MobileNav, useMobileNavHeight } from '@/components/MobileNav';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { DesktopHeader } from '@/components/DesktopHeader';

export default function ComponentsScreen() {
  const theme = useTheme();
  const mobileNavHeight = useMobileNavHeight();
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && screenWidth < 720;
  const isMobileView = !isWeb || isCompactWeb;
  const [text, setText] = useState('');
  const [password, setPassword] = useState('');
  const [checked, setChecked] = useState(false);
  const [checked2, setChecked2] = useState(true);
  const [radioValue, setRadioValue] = useState('first');
  const [switchOn, setSwitchOn] = useState(false);
  const [segmentValue, setSegmentValue] = useState('day');

  return (
    <View style={[styles.screen, isMobileView && styles.screenMobile]}>
      <DesktopHeader />
      <SafeAreaView style={[styles.container, isMobileView ? styles.containerMobile : styles.containerDesktop]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: mobileNavHeight }]}>
        {/* Buttons Section */}
        <Section title="Buttons">
          <View style={styles.row}>
            <Button mode="contained" onPress={() => {}}>
              Contained
            </Button>
            <Button mode="outlined" onPress={() => {}}>
              Outlined
            </Button>
            <Button mode="text" onPress={() => {}}>
              Text
            </Button>
          </View>
          <View style={styles.row}>
            <Button mode="contained-tonal" onPress={() => {}}>
              Tonal
            </Button>
            <Button mode="elevated" onPress={() => {}}>
              Elevated
            </Button>
          </View>
          <View style={styles.row}>
            <Button mode="contained" icon="camera" onPress={() => {}}>
              With Icon
            </Button>
            <Button mode="contained" loading onPress={() => {}}>
              Loading
            </Button>
          </View>
        </Section>

        <Divider style={styles.divider} />

        {/* Icon Buttons */}
        <Section title="Icon Buttons">
          <View style={styles.row}>
            <IconButton icon="heart" mode="contained" onPress={() => {}} />
            <IconButton icon="star" mode="contained-tonal" onPress={() => {}} />
            <IconButton icon="bookmark" mode="outlined" onPress={() => {}} />
            <IconButton icon="share" onPress={() => {}} />
          </View>
        </Section>

        <Divider style={styles.divider} />

        {/* Text Inputs */}
        <Section title="Text Inputs">
          <TextInput
            label="Standard Input"
            value={text}
            onChangeText={setText}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            right={<TextInput.Icon icon="eye" />}
            style={styles.input}
          />
          <TextInput
            label="With Icon"
            mode="outlined"
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
          />
          <TextInput
            label="Flat Input"
            mode="flat"
            style={styles.input}
          />
        </Section>

        <Divider style={styles.divider} />

        {/* Checkboxes */}
        <Section title="Checkboxes">
          <View style={styles.checkboxRow}>
            <Checkbox
              status={checked ? 'checked' : 'unchecked'}
              onPress={() => setChecked(!checked)}
            />
            <Text variant="bodyLarge" onPress={() => setChecked(!checked)}>
              Option 1 (unchecked by default)
            </Text>
          </View>
          <View style={styles.checkboxRow}>
            <Checkbox
              status={checked2 ? 'checked' : 'unchecked'}
              onPress={() => setChecked2(!checked2)}
            />
            <Text variant="bodyLarge" onPress={() => setChecked2(!checked2)}>
              Option 2 (checked by default)
            </Text>
          </View>
        </Section>

        <Divider style={styles.divider} />

        {/* Radio Buttons */}
        <Section title="Radio Buttons">
          <RadioButton.Group
            onValueChange={(value) => setRadioValue(value)}
            value={radioValue}
          >
            <View style={styles.checkboxRow}>
              <RadioButton value="first" />
              <Text variant="bodyLarge" onPress={() => setRadioValue('first')}>
                First Option
              </Text>
            </View>
            <View style={styles.checkboxRow}>
              <RadioButton value="second" />
              <Text variant="bodyLarge" onPress={() => setRadioValue('second')}>
                Second Option
              </Text>
            </View>
            <View style={styles.checkboxRow}>
              <RadioButton value="third" />
              <Text variant="bodyLarge" onPress={() => setRadioValue('third')}>
                Third Option
              </Text>
            </View>
          </RadioButton.Group>
        </Section>

        <Divider style={styles.divider} />

        {/* Switch */}
        <Section title="Switch">
          <View style={styles.switchRow}>
            <Text variant="bodyLarge">Enable notifications</Text>
            <Switch value={switchOn} onValueChange={setSwitchOn} />
          </View>
        </Section>

        <Divider style={styles.divider} />

        {/* Segmented Buttons */}
        <Section title="Segmented Buttons">
          <SegmentedButtons
            value={segmentValue}
            onValueChange={setSegmentValue}
            buttons={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
          />
        </Section>

        <Divider style={styles.divider} />

        {/* Chips */}
        <Section title="Chips">
          <View style={styles.chipRow}>
            <Chip icon="information" onPress={() => {}}>
              Info
            </Chip>
            <Chip selected onPress={() => {}}>
              Selected
            </Chip>
            <Chip icon="close" onClose={() => {}}>
              Closable
            </Chip>
          </View>
        </Section>

        {/* FAB */}
        <View style={styles.fabContainer}>
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => {}}
          />
        </View>
        </ScrollView>
      </SafeAreaView>
      <MobileNav />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Surface style={styles.section} elevation={0}>
      <Text variant="titleLarge" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenMobile: {
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
  containerDesktop: {
    backgroundColor: colors.hotPinkLight,
  },
  containerMobile: {
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  divider: {
    marginVertical: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  fab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
});
