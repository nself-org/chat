/**
 * VoiceRecorder - Voice recording component with waveform
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native'

import { useTheme } from '@theme'
import { formatDuration } from '@shared/utils'
import { MAX_VOICE_DURATION } from '@shared/constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void
  onCancel: () => void
  maxDuration?: number
}

export function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = MAX_VOICE_DURATION,
}: VoiceRecorderProps) {
  const { theme } = useTheme()

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isLocked, setIsLocked] = useState(false)

  const slideAnimation = useRef(new Animated.Value(0)).current
  const lockAnimation = useRef(new Animated.Value(0)).current
  const waveformAnimation = useRef(new Animated.Value(0)).current

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startX = useRef(0)

  // Waveform animation
  useEffect(() => {
    if (isRecording && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveformAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(waveformAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      waveformAnimation.stopAnimation()
    }
  }, [isRecording, isPaused, waveformAnimation])

  // Duration timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            handleStop()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused, maxDuration])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        startX.current = evt.nativeEvent.pageX
        handleStart()
      },
      onPanResponderMove: (_, gestureState) => {
        // Slide to cancel (left)
        if (gestureState.dx < -50) {
          slideAnimation.setValue(Math.min(0, gestureState.dx + 50))
        }
        // Slide to lock (up)
        if (gestureState.dy < -50) {
          lockAnimation.setValue(Math.min(0, gestureState.dy + 50))
          if (gestureState.dy < -100) {
            setIsLocked(true)
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Check for cancel
        if (gestureState.dx < -100) {
          handleCancel()
          return
        }
        // Check for lock
        if (isLocked) {
          return
        }
        // Otherwise, stop and send
        handleStop()
      },
    })
  ).current

  const handleStart = useCallback(() => {
    setIsRecording(true)
    setDuration(0)
    // Start actual recording using expo-av or similar
  }, [])

  const handleStop = useCallback(() => {
    setIsRecording(false)
    setIsPaused(false)
    setIsLocked(false)
    slideAnimation.setValue(0)
    lockAnimation.setValue(0)
    // Stop recording and get URI
    // For now, using mock data
    onRecordingComplete('mock-recording-uri', duration)
    setDuration(0)
  }, [duration, onRecordingComplete, slideAnimation, lockAnimation])

  const handleCancel = useCallback(() => {
    setIsRecording(false)
    setIsPaused(false)
    setIsLocked(false)
    setDuration(0)
    slideAnimation.setValue(0)
    lockAnimation.setValue(0)
    onCancel()
  }, [onCancel, slideAnimation, lockAnimation])

  const handlePause = useCallback(() => {
    setIsPaused(!isPaused)
  }, [isPaused])

  // Generate waveform bars
  const renderWaveform = () => {
    const bars = []
    for (let i = 0; i < 30; i++) {
      const randomHeight = Math.random() * 20 + 10
      bars.push(
        <Animated.View
          key={i}
          style={[
            styles.waveformBar,
            {
              height: randomHeight,
              backgroundColor: theme.colors.primary,
              opacity: waveformAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
              transform: [
                {
                  scaleY: waveformAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ],
            },
          ]}
        />
      )
    }
    return bars
  }

  if (!isRecording && !isLocked) {
    // Initial state - just show the record button hint
    return null
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Slide to cancel indicator */}
      <Animated.View
        style={[
          styles.slideIndicator,
          {
            transform: [{ translateX: slideAnimation }],
            opacity: slideAnimation.interpolate({
              inputRange: [-100, 0],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        <Text style={{ color: theme.colors.muted }}>{'< Slide to cancel'}</Text>
      </Animated.View>

      {/* Waveform */}
      <View style={styles.waveformContainer}>{renderWaveform()}</View>

      {/* Duration */}
      <View style={styles.durationContainer}>
        <View style={[styles.recordingDot, { backgroundColor: theme.colors.error }]} />
        <Text style={[styles.durationText, { color: theme.colors.text }]}>
          {formatDuration(duration)}
        </Text>
      </View>

      {/* Controls when locked */}
      {isLocked && (
        <View style={styles.lockedControls}>
          <Pressable
            style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleCancel}
          >
            <Text style={{ color: theme.colors.error }}>trash</Text>
          </Pressable>

          <Pressable
            style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
            onPress={handlePause}
          >
            <Text style={{ color: theme.colors.text }}>
              {isPaused ? 'play' : 'pause'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleStop}
          >
            <Text style={{ color: theme.colors.buttonPrimaryText }}>send</Text>
          </Pressable>
        </View>
      )}

      {/* Lock indicator */}
      {!isLocked && (
        <Animated.View
          style={[
            styles.lockIndicator,
            {
              backgroundColor: theme.colors.surface,
              transform: [{ translateY: lockAnimation }],
            },
          ]}
        >
          <Text style={{ color: theme.colors.muted }}>lock</Text>
        </Animated.View>
      )}

      {/* Recording button (when not locked) */}
      {!isLocked && (
        <View
          style={[
            styles.recordButton,
            { backgroundColor: theme.colors.error },
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={{ color: '#FFFFFF' }}>mic</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  slideIndicator: {
    position: 'absolute',
    left: 60,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 2,
    marginHorizontal: 16,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  durationText: {
    fontSize: 15,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  lockedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIndicator: {
    position: 'absolute',
    right: 24,
    top: -60,
    width: 40,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  recordButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default VoiceRecorder
