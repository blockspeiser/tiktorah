import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { FeedCard } from '@/types/cards';

interface DataModalProps {
  visible: boolean;
  onClose: () => void;
  card: FeedCard | null;
}

// Render JSON with syntax highlighting
function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const indent = depth * 16;

  if (value === null) {
    return <Text style={styles.nullValue}>null</Text>;
  }

  if (value === undefined) {
    return <Text style={styles.nullValue}>undefined</Text>;
  }

  if (typeof value === 'string') {
    // Truncate very long strings for display
    const displayValue = value.length > 500 ? value.substring(0, 500) + '...' : value;
    return <Text style={styles.stringValue}>"{displayValue}"</Text>;
  }

  if (typeof value === 'number') {
    return <Text style={styles.numberValue}>{value}</Text>;
  }

  if (typeof value === 'boolean') {
    return <Text style={styles.booleanValue}>{value ? 'true' : 'false'}</Text>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <Text style={styles.bracket}>[]</Text>;
    }
    return (
      <View>
        <Text style={styles.bracket}>[</Text>
        {value.map((item, index) => (
          <View key={index} style={[styles.row, { marginLeft: indent + 16 }]}>
            <JsonValue value={item} depth={depth + 1} />
            {index < value.length - 1 && <Text style={styles.punctuation}>,</Text>}
          </View>
        ))}
        <Text style={[styles.bracket, { marginLeft: indent }]}>]</Text>
      </View>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <Text style={styles.bracket}>{'{}'}</Text>;
    }
    return (
      <View>
        <Text style={styles.bracket}>{'{'}</Text>
        {entries.map(([key, val], index) => (
          <View key={key} style={[styles.row, { marginLeft: indent + 16 }]}>
            <Text style={styles.key}>"{key}"</Text>
            <Text style={styles.punctuation}>: </Text>
            <JsonValue value={val} depth={depth + 1} />
            {index < entries.length - 1 && <Text style={styles.punctuation}>,</Text>}
          </View>
        ))}
        <Text style={[styles.bracket, { marginLeft: indent }]}>{'}'}</Text>
      </View>
    );
  }

  return <Text>{String(value)}</Text>;
}

export function DataModal({ visible, onClose, card }: DataModalProps) {
  if (!card) return null;

  const typeLabel = card.type.charAt(0).toUpperCase() + card.type.slice(1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{typeLabel} Data</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.gray[600]} />
            </Pressable>
          </View>

          {/* Card title */}
          <Text style={styles.cardTitle}>{card.title}</Text>

          {/* JSON content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator>
            <View style={styles.jsonContainer}>
              <JsonValue value={card} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    maxWidth: 700,
    maxHeight: '85%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  closeButton: {
    padding: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: colors.gray[500],
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  jsonContainer: {
    padding: 20,
    paddingTop: 8,
    fontFamily: 'monospace',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  key: {
    color: '#881391',
    fontFamily: 'monospace',
    fontSize: 16,
  },
  stringValue: {
    color: '#1a7f37',
    fontFamily: 'monospace',
    fontSize: 16,
    flexShrink: 1,
  },
  numberValue: {
    color: '#0550ae',
    fontFamily: 'monospace',
    fontSize: 16,
  },
  booleanValue: {
    color: '#cf222e',
    fontFamily: 'monospace',
    fontSize: 16,
  },
  nullValue: {
    color: colors.gray[500],
    fontFamily: 'monospace',
    fontSize: 16,
    fontStyle: 'italic',
  },
  bracket: {
    color: colors.gray[700],
    fontFamily: 'monospace',
    fontSize: 16,
  },
  punctuation: {
    color: colors.gray[600],
    fontFamily: 'monospace',
    fontSize: 16,
  },
});
