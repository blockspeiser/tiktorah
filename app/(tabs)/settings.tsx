import { StyleSheet, View, ScrollView, Platform, useWindowDimensions, Image, Pressable, Linking } from 'react-native';
import {
  Text,
  List,
  Checkbox,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeedPreferences } from '@/hooks/useFeedPreferences';
import { MobileNav, useMobileNavHeight } from '@/components/MobileNav';
import { DesktopHeader } from '@/components/DesktopHeader';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const { preferences, setPreference, loading: prefsLoading } = useFeedPreferences();
  const mobileNavHeight = useMobileNavHeight();
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && screenWidth < 720;
  const isMobileView = !isWeb || isCompactWeb;

  return (
    <View style={[styles.screen, isMobileView && styles.screenMobile]}>
      <DesktopHeader />
      <SafeAreaView style={[styles.container, isMobileView ? styles.containerMobile : styles.containerDesktop]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: mobileNavHeight }]}>
          {isMobileView ? (
            <View style={[styles.maxWidth, styles.titleRow]}>
              <MaterialCommunityIcons name="cog-outline" size={24} color={colors.gray[800]} />
              <Text style={styles.mobileHeader}>Settings</Text>
            </View>
          ) : (
            <Text style={[styles.pageTitle, styles.maxWidth, styles.pageTitleAligned]}>Settings</Text>
          )}
          {isMobileView ? (
            <View style={[styles.card, styles.maxWidth, styles.cardMobile]}>
              <View style={styles.mobileSectionSpacer} />

              <List.Section>
                <List.Subheader style={styles.sectionHeaderMobile}>Cards</List.Subheader>
                {prefsLoading ? (
                  <View style={styles.centered}>
                    <ActivityIndicator />
                  </View>
                ) : (
                  <>
                    <List.Item
                      title="Texts"
                      description="Descriptions of individual books in the Sefaria library"
                      left={(props) => <List.Icon {...props} icon="book-open-page-variant" />}
                      right={() => (
                        <View style={styles.checkboxContainer}>
                          <Checkbox
                            status={preferences.texts ? 'checked' : 'unchecked'}
                            onPress={() => setPreference('texts', !preferences.texts)}
                          />
                        </View>
                      )}
                    />
                    <Divider />
                    <List.Item
                      title="Categories"
                      description="Types and genres of texts like Midrash and Kabbalah"
                      left={(props) => <List.Icon {...props} icon="shape-outline" />}
                      right={() => (
                        <View style={styles.checkboxContainer}>
                          <Checkbox
                            status={preferences.categories ? 'checked' : 'unchecked'}
                            onPress={() => setPreference('categories', !preferences.categories)}
                          />
                        </View>
                      )}
                    />
                    <Divider />
                    <List.Item
                      title="Commentaries"
                      description="Commentaries on texts like Rashi and Ramban"
                      left={(props) => <List.Icon {...props} icon="comment-text-outline" />}
                      right={() => (
                        <View style={styles.checkboxContainer}>
                          <Checkbox
                            status={preferences.commentaries ? 'checked' : 'unchecked'}
                            onPress={() => setPreference('commentaries', !preferences.commentaries)}
                          />
                        </View>
                      )}
                    />
                    <Divider />
                    <List.Item
                      title="Topics"
                      description="Jewish topics like holidays, Torah portions, or Talmudic figures"
                      left={(props) => <List.Icon {...props} icon="tag-multiple" />}
                      right={() => (
                        <View style={styles.checkboxContainer}>
                          <Checkbox
                            status={preferences.topics ? 'checked' : 'unchecked'}
                            onPress={() => setPreference('topics', !preferences.topics)}
                          />
                        </View>
                      )}
                    />
                    <Divider />
                    <List.Item
                      title="Memes"
                      description="Torah related memes submited by users"
                      left={(props) => <List.Icon {...props} icon="image-multiple" />}
                      right={() => (
                        <View style={styles.checkboxContainer}>
                          <Checkbox
                            status={preferences.memes ? 'checked' : 'unchecked'}
                            onPress={() => setPreference('memes', !preferences.memes)}
                          />
                        </View>
                      )}
                    />
                    <Divider />
                    <List.Item
                      title="Comments"
                      description="User comments on Torah sources"
                      left={(props) => <List.Icon {...props} icon="comment-quote" />}
                      right={() => (
                        <View style={styles.checkboxContainer}>
                          <Checkbox
                            status={preferences.comments ? 'checked' : 'unchecked'}
                            onPress={() => setPreference('comments', !preferences.comments)}
                          />
                        </View>
                      )}
                    />
                  </>
                )}
              </List.Section>

              <List.Section>
                <List.Subheader style={styles.sectionHeaderMobile}>Account</List.Subheader>
                <List.Item
                  title="Profile"
                  description="View your profile and memes"
                  left={(props) => <List.Icon {...props} icon="account" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => router.push('/profile')}
                />
              </List.Section>

              <View style={styles.footer}>
                <Pressable
                  onPress={() => {
                    const url = 'https://www.sefaria.org';
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    } else {
                      Linking.openURL(url);
                    }
                  }}
                >
                  <Image
                    source={require('@/public/powered-by-sefaria.png')}
                    style={styles.sefariaLogo}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.card, styles.maxWidth]}>
                <List.Section style={styles.desktopSection}>
                  <List.Subheader style={styles.sectionHeader}>Cards</List.Subheader>
                  {prefsLoading ? (
                    <View style={styles.centered}>
                      <ActivityIndicator />
                    </View>
                  ) : (
                    <>
                      <List.Item
                        title="Texts"
                        description="Descriptions of individual books in the Sefaria library"
                        left={(props) => <List.Icon {...props} icon="book-open-page-variant" />}
                        right={() => (
                          <View style={styles.checkboxContainer}>
                            <Checkbox
                              status={preferences.texts ? 'checked' : 'unchecked'}
                              onPress={() => setPreference('texts', !preferences.texts)}
                            />
                          </View>
                        )}
                      />
                      <Divider />
                      <List.Item
                        title="Categories"
                        description="Types and genres of texts like Midrash and Kabbalah"
                        left={(props) => <List.Icon {...props} icon="shape-outline" />}
                        right={() => (
                          <View style={styles.checkboxContainer}>
                            <Checkbox
                              status={preferences.categories ? 'checked' : 'unchecked'}
                              onPress={() => setPreference('categories', !preferences.categories)}
                            />
                          </View>
                        )}
                      />
                      <Divider />
                      <List.Item
                        title="Commentaries"
                        description="Commentaries on texts like Rashi and Ramban"
                        left={(props) => <List.Icon {...props} icon="comment-text-outline" />}
                        right={() => (
                          <View style={styles.checkboxContainer}>
                            <Checkbox
                              status={preferences.commentaries ? 'checked' : 'unchecked'}
                              onPress={() => setPreference('commentaries', !preferences.commentaries)}
                            />
                          </View>
                        )}
                      />
                      <Divider />
                      <List.Item
                        title="Topics"
                        description="Jewish topics like holidays, Torah portions, or Talmudic figures"
                        left={(props) => <List.Icon {...props} icon="tag-multiple" />}
                        right={() => (
                          <View style={styles.checkboxContainer}>
                            <Checkbox
                              status={preferences.topics ? 'checked' : 'unchecked'}
                              onPress={() => setPreference('topics', !preferences.topics)}
                            />
                          </View>
                        )}
                      />
                      <Divider />
                      <List.Item
                        title="Memes"
                        description="Torah related memes submited by users"
                        left={(props) => <List.Icon {...props} icon="image-multiple" />}
                        right={() => (
                          <View style={styles.checkboxContainer}>
                            <Checkbox
                              status={preferences.memes ? 'checked' : 'unchecked'}
                              onPress={() => setPreference('memes', !preferences.memes)}
                            />
                          </View>
                        )}
                      />
                      <Divider />
                      <List.Item
                        title="Comments"
                        description="User comments on Torah sources"
                        left={(props) => <List.Icon {...props} icon="comment-quote" />}
                        right={() => (
                          <View style={styles.checkboxContainer}>
                            <Checkbox
                              status={preferences.comments ? 'checked' : 'unchecked'}
                              onPress={() => setPreference('comments', !preferences.comments)}
                            />
                          </View>
                        )}
                      />
                    </>
                  )}
                </List.Section>
              </View>

              <View style={[styles.card, styles.maxWidth, styles.cardMarginTop]}>
                <List.Section style={styles.desktopSection}>
                  <List.Subheader style={styles.sectionHeader}>Account</List.Subheader>
                  <List.Item
                    title="Profile"
                    description="View your profile and memes"
                    left={(props) => <List.Icon {...props} icon="account" />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => router.push('/profile')}
                  />
                </List.Section>
              </View>

              <View style={[styles.footerDesktop, styles.maxWidth]}>
                <Pressable
                  onPress={() => {
                    const url = 'https://www.sefaria.org';
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    } else {
                      Linking.openURL(url);
                    }
                  }}
                >
                  <Image
                    source={require('@/public/powered-by-sefaria.png')}
                    style={styles.sefariaLogo}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <MobileNav />
    </View>
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
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  maxWidth: {
    width: '100%',
    maxWidth: 760,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 48,
    marginBottom: 16,
  },
  mobileHeader: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
    color: colors.gray[900],
    marginTop: 48,
    marginBottom: 6,
  },
  titleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    paddingLeft: 16,
  },
  pageTitleAligned: {
    paddingLeft: 0,
  },
  checkboxContainer: {
    transform: [{ scale: 1.3 }],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
    width: '100%',
  },
  cardMobile: {
    borderWidth: 0,
    borderRadius: 0,
    padding: 0,
  },
  mobileSectionSpacer: {
    height: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
    paddingTop: 0,
    paddingLeft: 0,
  },
  sectionHeaderMobile: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  sefariaLogo: {
    width: 280,
    height: 84,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cardMarginTop: {
    marginTop: 16,
  },
  footerDesktop: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  desktopSection: {
    marginBottom: 0,
    marginTop: 0,
    paddingTop: 0,
  },
});
