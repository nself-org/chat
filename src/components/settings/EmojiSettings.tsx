'use client';

import { SettingsSection } from './settings-section';
import { SettingsToggle } from './SettingsToggle';
import { SettingsSelect } from './SettingsSelect';

interface EmojiSettingsProps {
  className?: string;
}

const skinToneOptions = [
  { value: 'default', label: 'Default' },
  { value: 'light', label: 'Light' },
  { value: 'medium-light', label: 'Medium-Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'medium-dark', label: 'Medium-Dark' },
  { value: 'dark', label: 'Dark' },
];

/**
 * EmojiSettings - Emoji preferences
 */
export function EmojiSettings({ className }: EmojiSettingsProps) {
  // Local state for now - would be part of settings store in production
  const showEmojiPreviews = true;
  const emojiAutocomplete = true;
  const preferredSkinTone = 'default';

  return (
    <SettingsSection
      title="Emojis"
      description="Customize emoji appearance and behavior"
      className={className}
    >
      <SettingsToggle
        id="emoji-previews"
        label="Show emoji previews"
        description="Display larger emoji preview when hovering"
        checked={showEmojiPreviews}
        onCheckedChange={() => {
          // TODO: Update setting
        }}
      />

      <SettingsToggle
        id="emoji-autocomplete"
        label="Emoji autocomplete"
        description="Suggest emojis as you type :emoji:"
        checked={emojiAutocomplete}
        onCheckedChange={() => {
          // TODO: Update setting
        }}
      />

      <SettingsSelect
        id="skin-tone"
        label="Preferred skin tone"
        description="Default skin tone for emoji selection"
        value={preferredSkinTone}
        onValueChange={() => {
          // TODO: Update setting
        }}
        options={skinToneOptions}
      />
    </SettingsSection>
  );
}
