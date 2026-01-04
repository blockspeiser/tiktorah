import React, { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface CardActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function CardActions({ onEdit, onDelete }: CardActionsProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDeletePress = () => {
    if (confirmingDelete) {
      onDelete();
    } else {
      setConfirmingDelete(true);
    }
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(false);
  };

  return (
    <View style={styles.container}>
      {confirmingDelete ? (
        <>
          <Pressable style={styles.iconButton} onPress={handleCancelDelete}>
            <MaterialCommunityIcons name="close" size={18} color={colors.gray[800]} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={handleDeletePress}>
            <MaterialCommunityIcons name="trash-can" size={18} color={colors.gray[800]} />
          </Pressable>
        </>
      ) : (
        <>
          <Pressable style={styles.iconButton} onPress={onEdit}>
            <MaterialCommunityIcons name="pencil" size={18} color={colors.gray[800]} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={handleDeletePress}>
            <MaterialCommunityIcons name="trash-can" size={18} color={colors.gray[800]} />
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
});
