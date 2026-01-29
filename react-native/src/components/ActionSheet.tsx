/**
 * ActionSheet - Bottom action sheet component
 */

import React, { useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface ActionSheetAction {
  label: string
  icon?: string
  destructive?: boolean
  disabled?: boolean
  onPress: () => void
}

interface ActionSheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  message?: string
  actions: ActionSheetAction[]
  showCancel?: boolean
  cancelLabel?: string
}

export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  actions,
  showCancel = true,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 0
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy)
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 100 || gestureState.vy > 0.5) {
            handleClose()
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
            }).start()
          }
        },
      }),
    [translateY]
  )

  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start()
    }
  }, [visible, translateY])

  const handleClose = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose()
    })
  }, [translateY, onClose])

  const handleActionPress = useCallback(
    (action: ActionSheetAction) => {
      if (action.disabled) return
      handleClose()
      // Small delay to allow animation to complete
      setTimeout(action.onPress, 200)
    },
    [handleClose]
  )

  if (!visible) return null

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable
          style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
          onPress={handleClose}
        />

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: insets.bottom || 16,
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Header */}
          {(title || message) && (
            <View style={styles.header}>
              {title && (
                <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
              )}
              {message && (
                <Text style={[styles.message, { color: theme.colors.muted }]}>
                  {message}
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={[styles.actionsContainer, { backgroundColor: theme.colors.surface }]}>
            {actions.map((action, index) => (
              <Pressable
                key={index}
                style={[
                  styles.action,
                  index < actions.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  },
                  action.disabled && styles.actionDisabled,
                ]}
                onPress={() => handleActionPress(action)}
                disabled={action.disabled}
              >
                {action.icon && (
                  <Text
                    style={[
                      styles.actionIcon,
                      {
                        color: action.destructive
                          ? theme.colors.error
                          : action.disabled
                            ? theme.colors.muted
                            : theme.colors.text,
                      },
                    ]}
                  >
                    {action.icon}
                  </Text>
                )}
                <Text
                  style={[
                    styles.actionLabel,
                    {
                      color: action.destructive
                        ? theme.colors.error
                        : action.disabled
                          ? theme.colors.muted
                          : theme.colors.text,
                    },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Cancel Button */}
          {showCancel && (
            <Pressable
              style={[styles.cancelButton, { backgroundColor: theme.colors.surface }]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelLabel, { color: theme.colors.primary }]}>
                {cancelLabel}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  actionsContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
})

export default ActionSheet
