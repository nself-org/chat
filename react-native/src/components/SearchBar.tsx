/**
 * SearchBar - Search input component
 */

import React, { forwardRef } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  TextInputProps,
} from 'react-native'
import { Text } from 'react-native'

import { useTheme } from '@theme'

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string
  onChangeText: (text: string) => void
  onClear?: () => void
  showCancelButton?: boolean
  onCancel?: () => void
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>(
  (
    {
      value,
      onChangeText,
      onClear,
      showCancelButton = false,
      onCancel,
      placeholder = 'Search...',
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme()

    const handleClear = () => {
      onChangeText('')
      onClear?.()
    }

    return (
      <View style={styles.container}>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.colors.inputBackground },
          ]}
        >
          {/* Search Icon */}
          <View style={styles.searchIcon}>
            <Text style={{ color: theme.colors.placeholder }}>search</Text>
          </View>

          {/* Input */}
          <TextInput
            ref={ref}
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.placeholder}
            value={value}
            onChangeText={onChangeText}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            {...props}
          />

          {/* Clear Button */}
          {value.length > 0 && (
            <Pressable style={styles.clearButton} onPress={handleClear}>
              <View
                style={[
                  styles.clearIcon,
                  { backgroundColor: theme.colors.muted },
                ]}
              >
                <Text style={{ color: theme.colors.background, fontSize: 10 }}>X</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Cancel Button */}
        {showCancelButton && (
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={[styles.cancelText, { color: theme.colors.primary }]}>
              Cancel
            </Text>
          </Pressable>
        )}
      </View>
    )
  }
)

SearchBar.displayName = 'SearchBar'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  searchIcon: {
    width: 28,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingLeft: 12,
  },
  cancelText: {
    fontSize: 16,
  },
})

export default SearchBar
