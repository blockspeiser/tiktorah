import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Pressable, Modal } from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { fetchCitationPreview, sanitizeText } from '@/services/sefariaText';

interface MemeCardProps {
  imageUrl: string;
  caption: string | null;
  citation: string;
  citationText: string | null;
  citationCategory: string | null;
  memeLink: string | null;
  onSave: (caption: string, memeLink: string, citation?: string, citationText?: string, citationCategory?: string | null) => Promise<void>;
  onDelete: () => Promise<void>;
  showActions?: boolean;
  imageMode?: 'cover' | 'contain';
  autoHeight?: boolean;
}

function parseCitationInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { citation: '', error: null as string | null };
  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      const path = url.pathname.replace(/^\/+/, '');
      if (!path) return { citation: '', error: 'Citation URL is missing a path.' };
      const cleaned = path.replace(/^texts\//, '');
      return { citation: decodeURIComponent(cleaned.replace(/_/g, ' ')), error: null };
    } catch {
      return { citation: '', error: 'Invalid citation URL.' };
    }
  }
  return { citation: trimmed, error: null };
}

export function MemeCard({
  imageUrl,
  caption,
  citation,
  citationText,
  citationCategory,
  memeLink,
  onSave,
  onDelete,
  showActions = true,
  imageMode = 'cover',
  autoHeight = false,
}: MemeCardProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [nextCaption, setNextCaption] = useState(caption ?? '');
  const [nextLink, setNextLink] = useState(memeLink ?? '');
  const [citationInput, setCitationInput] = useState(citation ?? '');
  const [citationPreview, setCitationPreview] = useState<{ ref: string; text: string; category?: string | null } | null>(
    citation && citationText ? { ref: citation, text: sanitizeText(citationText), category: citationCategory } : null
  );
  const [citationError, setCitationError] = useState<string | null>(null);
  const [citationLoading, setCitationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleEditOpen = () => {
    if (!showActions) return;
    setNextCaption(caption ?? '');
    setNextLink(memeLink ?? '');
    setCitationInput(citation ?? '');
    setCitationPreview(citation && citationText ? { ref: citation, text: sanitizeText(citationText), category: citationCategory } : null);
    setCitationError(null);
    setEditing(true);
  };

  useEffect(() => {
    if (!editing) return;
    let active = true;
    const parsed = parseCitationInput(citationInput);
    if (!parsed.citation) {
      setCitationPreview(null);
      setCitationError(parsed.error);
      return;
    }

    setCitationLoading(true);
    const timeout = setTimeout(() => {
      fetchCitationPreview(parsed.citation)
        .then((preview) => {
          if (!active) return;
          if (!preview) {
            setCitationPreview(null);
            setCitationError('Citation not recognized by Sefaria.');
            return;
          }
          setCitationPreview(preview);
          setCitationError(null);
        })
        .finally(() => {
          if (active) setCitationLoading(false);
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [citationInput, editing]);

  const handleSave = async () => {
    if (!citationPreview) {
      setCitationError('Citation is required.');
      return;
    }
    setSaving(true);
    await onSave(
      nextCaption.trim(),
      nextLink.trim(),
      citationPreview.ref,
      sanitizeText(citationPreview.text),
      citationPreview.category ?? null
    );
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setConfirmDelete(false);
  };

  useEffect(() => {
    if (!autoHeight || !imageUrl) {
      setAspectRatio(null);
      return;
    }
    let active = true;
    Image.getSize(
      imageUrl,
      (width, height) => {
        if (!active) return;
        if (width > 0 && height > 0) {
          setAspectRatio(width / height);
        }
      },
      () => {
        if (active) setAspectRatio(1);
      }
    );
    return () => {
      active = false;
    };
  }, [autoHeight, imageUrl]);

  const imageStyle = [
    styles.imageBase,
    !autoHeight && styles.imageFixed,
    autoHeight ? { height: undefined, aspectRatio: aspectRatio ?? 1 } : null,
  ];

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="image" size={32} color={colors.hotPink} />
          <Text style={styles.headerLabel}>MEME</Text>
        </View>
        {showActions && (
          <View style={styles.headerActions}>
            {confirmDelete ? (
              <>
                <Pressable style={styles.iconButton} onPress={() => setConfirmDelete(false)} disabled={deleting}>
                  <MaterialCommunityIcons name="close" size={18} color={colors.gray[800]} />
                </Pressable>
                <Pressable style={styles.iconButton} onPress={handleDelete} disabled={deleting}>
                  {deleting ? <ActivityIndicator color={colors.gray[800]} size="small" /> : (
                    <MaterialCommunityIcons name="trash-can" size={18} color={colors.gray[800]} />
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.iconButton} onPress={handleEditOpen}>
                  <MaterialCommunityIcons name="pencil" size={18} color={colors.gray[800]} />
                </Pressable>
                <Pressable style={styles.iconButton} onPress={() => setConfirmDelete(true)} disabled={deleting}>
                  {deleting ? <ActivityIndicator color={colors.gray[800]} size="small" /> : (
                    <MaterialCommunityIcons name="trash-can" size={18} color={colors.gray[800]} />
                  )}
                </Pressable>
              </>
            )}
          </View>
        )}
      </View>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={imageStyle} resizeMode={imageMode} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator />
        </View>
      )}
      <View style={styles.meta}>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>

      {showActions && (
        <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Meme</Text>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="contain" />
            ) : null}
            {citationPreview && (
              <View style={styles.citationBox}>
                <Text style={styles.citationRef}>{citationPreview.ref}</Text>
                <Text style={styles.citationText} numberOfLines={6} ellipsizeMode="tail">
                  {citationPreview.text}
                </Text>
              </View>
            )}
            <TextInput
              label="Citation"
              value={citationInput}
              onChangeText={setCitationInput}
              mode="outlined"
              style={styles.input}
              placeholder="e.g. Genesis 1:1 or https://www.sefaria.org/Genesis.1.1"
            />
            {citationLoading && (
              <View style={styles.inline}>
                <ActivityIndicator />
                <Text style={styles.modalCaption}>Checking citation...</Text>
              </View>
            )}
            {citationError && <Text style={styles.error}>{citationError}</Text>}
            <TextInput
              label="Caption"
              value={nextCaption}
              onChangeText={setNextCaption}
              mode="outlined"
              style={styles.input}
              multiline
            />
            <TextInput
              label="Meme Link"
              value={nextLink}
              onChangeText={setNextLink}
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.button} onPress={() => setEditing(false)} disabled={saving}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: 'hidden',
    marginBottom: 16,
  },
  accentBar: {
    height: 24,
    width: '100%',
    backgroundColor: colors.hotPink,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLabel: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.hotPink,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  imageBase: {
    width: '100%',
    backgroundColor: colors.gray[100],
  },
  imageFixed: {
    height: 220,
  },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    padding: 16,
  },
  caption: {
    fontSize: 16,
    color: colors.gray[800],
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.gray[100],
  },
  modalCaption: {
    fontSize: 15,
    color: colors.gray[700],
    marginBottom: 12,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  error: {
    color: colors.hotPink,
    marginBottom: 8,
  },
  citationBox: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 6,
    borderColor: colors.gray[300],
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  citationRef: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[500],
    marginBottom: 6,
    fontFamily: 'serif',
  },
  citationText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[700],
    fontFamily: 'serif',
  },
  input: {
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  buttonText: {
    color: colors.gray[700],
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: colors['sefaria-blue'],
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: colors.hotPink,
  },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: colors.hotPink,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
