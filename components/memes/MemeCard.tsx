import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Pressable, Modal } from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
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

export function MemeCard({ imageUrl, caption, citation, citationText, citationCategory, memeLink, onSave, onDelete }: MemeCardProps) {
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

  return (
    <View style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator />
        </View>
      )}
      <View style={styles.meta}>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        {confirmDelete ? (
          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={() => setConfirmDelete(false)} disabled={deleting}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
              {deleting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Confirm Delete</Text>}
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={handleEditOpen}>
              <Text style={styles.buttonText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => setConfirmDelete(true)} disabled={deleting}>
              {deleting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Delete</Text>}
            </Pressable>
          </View>
        )}
      </View>

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
  image: {
    width: '100%',
    height: 220,
    backgroundColor: colors.gray[100],
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
