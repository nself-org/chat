/**
 * MediaPicker - Photo/video picker component
 */

import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native'

import { useTheme } from '@theme'
import { ActionSheet } from './ActionSheet'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IMAGE_SIZE = (SCREEN_WIDTH - 48) / 3

interface MediaItem {
  id: string
  uri: string
  type: 'image' | 'video'
  duration?: number
}

interface MediaPickerProps {
  visible: boolean
  onClose: () => void
  onSelect: (items: MediaItem[]) => void
  maxSelection?: number
  mediaType?: 'all' | 'image' | 'video'
}

export function MediaPicker({
  visible,
  onClose,
  onSelect,
  maxSelection = 10,
  mediaType = 'all',
}: MediaPickerProps) {
  const { theme } = useTheme()

  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [showSourcePicker, setShowSourcePicker] = useState(true)

  const handleSourceSelect = useCallback((source: 'library' | 'camera') => {
    setShowSourcePicker(false)

    if (source === 'camera') {
      // Open camera
      // This would use expo-camera or react-native-camera
      Alert.alert('Camera', 'Camera would open here')
    } else {
      // Load media library
      // This would use expo-media-library or @react-native-camera-roll/camera-roll
      // For now, showing mock data
      setMediaItems([
        { id: '1', uri: 'https://picsum.photos/200/200?1', type: 'image' },
        { id: '2', uri: 'https://picsum.photos/200/200?2', type: 'image' },
        { id: '3', uri: 'https://picsum.photos/200/200?3', type: 'video', duration: 30 },
        { id: '4', uri: 'https://picsum.photos/200/200?4', type: 'image' },
        { id: '5', uri: 'https://picsum.photos/200/200?5', type: 'image' },
        { id: '6', uri: 'https://picsum.photos/200/200?6', type: 'video', duration: 60 },
      ])
    }
  }, [])

  const handleItemPress = useCallback((item: MediaItem) => {
    setSelectedItems((prev) => {
      if (prev.includes(item.id)) {
        return prev.filter((id) => id !== item.id)
      }
      if (prev.length >= maxSelection) {
        Alert.alert('Limit reached', `You can only select up to ${maxSelection} items`)
        return prev
      }
      return [...prev, item.id]
    })
  }, [maxSelection])

  const handleDone = useCallback(() => {
    const selected = mediaItems.filter((item) => selectedItems.includes(item.id))
    onSelect(selected)
    onClose()
    setSelectedItems([])
    setShowSourcePicker(true)
  }, [mediaItems, selectedItems, onSelect, onClose])

  const handleCancel = useCallback(() => {
    onClose()
    setSelectedItems([])
    setShowSourcePicker(true)
  }, [onClose])

  const renderMediaItem = ({ item }: { item: MediaItem }) => {
    const isSelected = selectedItems.includes(item.id)
    const selectionIndex = selectedItems.indexOf(item.id) + 1

    return (
      <Pressable
        style={styles.mediaItem}
        onPress={() => handleItemPress(item)}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.mediaImage}
          resizeMode="cover"
        />

        {/* Video duration badge */}
        {item.type === 'video' && item.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}

        {/* Selection indicator */}
        <View
          style={[
            styles.selectionIndicator,
            {
              backgroundColor: isSelected ? theme.colors.primary : 'transparent',
              borderColor: isSelected ? theme.colors.primary : '#FFFFFF',
            },
          ]}
        >
          {isSelected && (
            <Text style={styles.selectionNumber}>{selectionIndex}</Text>
          )}
        </View>
      </Pressable>
    )
  }

  // Source picker action sheet
  if (showSourcePicker) {
    return (
      <ActionSheet
        visible={visible}
        onClose={onClose}
        title="Select Media"
        actions={[
          {
            label: 'Photo Library',
            icon: 'image',
            onPress: () => handleSourceSelect('library'),
          },
          {
            label: 'Take Photo',
            icon: 'camera',
            onPress: () => handleSourceSelect('camera'),
          },
        ]}
      />
    )
  }

  // Media grid
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable style={styles.headerButton} onPress={handleCancel}>
          <Text style={[styles.headerButtonText, { color: theme.colors.text }]}>
            Cancel
          </Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {selectedItems.length > 0
            ? `${selectedItems.length} selected`
            : 'Select Media'}
        </Text>
        <Pressable
          style={styles.headerButton}
          onPress={handleDone}
          disabled={selectedItems.length === 0}
        >
          <Text
            style={[
              styles.headerButtonText,
              {
                color: selectedItems.length > 0
                  ? theme.colors.primary
                  : theme.colors.muted,
              },
            ]}
          >
            Done
          </Text>
        </Pressable>
      </View>

      {/* Media Grid */}
      <FlatList
        data={mediaItems}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  gridContent: {
    padding: 8,
  },
  mediaItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
})

export default MediaPicker
