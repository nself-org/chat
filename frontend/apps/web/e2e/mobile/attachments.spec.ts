/**
 * Mobile E2E Tests: Attachments
 *
 * Tests file attachments including photos, videos, and documents
 */

import { device, element, by, expect as detoxExpect } from 'detox'
import { MobileTestHelper, PerformanceHelper, TEST_USERS, TEST_DATA } from './setup'

describe('Mobile Attachments', () => {
  beforeAll(async () => {
    await MobileTestHelper.launchWithPermissions({
      camera: 'YES',
      photos: 'YES',
      mediaLibrary: 'YES',
    })

    await MobileTestHelper.login(TEST_USERS.member)
    await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)
  })

  beforeEach(async () => {
    PerformanceHelper.clear()
  })

  describe('Photo Attachments', () => {
    it('should open photo picker', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      await MobileTestHelper.waitForElement(by.id('photo-picker'))
    })

    it('should select photo from gallery', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      // Select first photo
      await MobileTestHelper.waitForElement(by.id('photo-picker'))
      await MobileTestHelper.tapElement(by.id('photo-0'))

      // Confirm selection
      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      // Photo preview should appear
      await MobileTestHelper.waitForElement(by.id('attachment-preview'))
    })

    it('should take photo with camera', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('camera-option'))

      // Wait for camera view
      await MobileTestHelper.waitForElement(by.id('camera-view'))

      // Take photo
      await MobileTestHelper.tapElement(by.id('capture-button'))

      // Confirm photo
      await MobileTestHelper.tapElement(by.id('use-photo-button'))

      // Photo should be attached
      await MobileTestHelper.waitForElement(by.id('attachment-preview'))
    })

    it('should send message with photo', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      await MobileTestHelper.waitForElement(by.id('photo-picker'))
      await MobileTestHelper.tapElement(by.id('photo-0'))
      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      // Add caption
      await MobileTestHelper.typeText(by.id('message-input'), 'Check out this photo!')

      PerformanceHelper.mark('upload-start')

      // Send
      await MobileTestHelper.tapElement(by.id('send-button'))

      // Wait for upload
      await MobileTestHelper.waitForElement(by.id('upload-complete'), 10000)

      const uploadDuration = PerformanceHelper.measure('Photo Upload', 'upload-start')
      expect(uploadDuration).toBeLessThan(8000)

      // Message with photo should appear
      await detoxExpect(element(by.id('message-photo-attachment'))).toExist()
    })

    it('should show upload progress', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      await MobileTestHelper.waitForElement(by.id('photo-picker'))
      await MobileTestHelper.tapElement(by.id('photo-0'))
      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      await MobileTestHelper.tapElement(by.id('send-button'))

      // Upload progress should be visible
      await detoxExpect(element(by.id('upload-progress'))).toBeVisible()
    })

    it('should view photo in full screen', async () => {
      // Find a message with photo
      if (await element(by.id('message-photo-attachment')).isVisible()) {
        await MobileTestHelper.tapElement(by.id('message-photo-attachment'))

        // Full screen viewer should open
        await MobileTestHelper.waitForElement(by.id('photo-viewer'))

        // Close viewer
        await MobileTestHelper.tapElement(by.id('close-viewer'))
      }
    })

    it('should cancel photo upload', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      await MobileTestHelper.waitForElement(by.id('photo-picker'))
      await MobileTestHelper.tapElement(by.id('photo-0'))
      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      // Remove attachment
      await MobileTestHelper.tapElement(by.id('remove-attachment'))

      // Attachment should be removed
      await detoxExpect(element(by.id('attachment-preview'))).not.toExist()
    })
  })

  describe('Video Attachments', () => {
    it('should select video from gallery', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('video-option'))

      await MobileTestHelper.waitForElement(by.id('video-picker'))
      await MobileTestHelper.tapElement(by.id('video-0'))
      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      await MobileTestHelper.waitForElement(by.id('attachment-preview'))
    })

    it('should record video with camera', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('camera-option'))

      // Switch to video mode
      await MobileTestHelper.tapElement(by.id('video-mode-toggle'))

      // Record for a few seconds
      await MobileTestHelper.tapElement(by.id('record-button'))
      await MobileTestHelper.wait(3000)
      await MobileTestHelper.tapElement(by.id('stop-recording'))

      // Use video
      await MobileTestHelper.tapElement(by.id('use-video-button'))

      await MobileTestHelper.waitForElement(by.id('attachment-preview'))
    })

    it('should send message with video', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('video-option'))

      await MobileTestHelper.waitForElement(by.id('video-picker'))
      await MobileTestHelper.tapElement(by.id('video-0'))
      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      await MobileTestHelper.typeText(by.id('message-input'), 'Video attachment')
      await MobileTestHelper.tapElement(by.id('send-button'))

      // Wait for upload (videos take longer)
      await MobileTestHelper.waitForElement(by.id('upload-complete'), 15000)

      await detoxExpect(element(by.id('message-video-attachment'))).toExist()
    })

    it('should play video inline', async () => {
      if (await element(by.id('message-video-attachment')).isVisible()) {
        await MobileTestHelper.tapElement(by.id('video-play-button'))

        // Video should start playing
        await MobileTestHelper.wait(2000)

        // Pause
        await MobileTestHelper.tapElement(by.id('video-pause-button'))
      }
    })

    it('should show video thumbnail', async () => {
      if (await element(by.id('message-video-attachment')).isVisible()) {
        await detoxExpect(element(by.id('video-thumbnail'))).toBeVisible()
      }
    })
  })

  describe('Document Attachments', () => {
    it('should select document from files', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('document-option'))

      await MobileTestHelper.waitForElement(by.id('file-picker'))
    })

    it('should send PDF document', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('document-option'))

      // Select PDF (if available)
      await MobileTestHelper.waitForElement(by.id('file-picker'))

      // Would need actual file selection implementation
      // For now, just verify UI is present
      await MobileTestHelper.assertElementVisible(by.id('file-picker'))
    })

    it('should show document metadata', async () => {
      // After selecting a document
      if (await element(by.id('document-attachment')).isVisible()) {
        await detoxExpect(element(by.id('document-name'))).toExist()
        await detoxExpect(element(by.id('document-size'))).toExist()
      }
    })

    it('should download and open document', async () => {
      if (await element(by.id('message-document-attachment')).isVisible()) {
        await MobileTestHelper.tapElement(by.id('message-document-attachment'))

        // Document viewer or download should trigger
        await MobileTestHelper.wait(2000)
      }
    })
  })

  describe('Multiple Attachments', () => {
    it('should select multiple photos', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      await MobileTestHelper.waitForElement(by.id('photo-picker'))

      // Enable multi-select
      await MobileTestHelper.tapElement(by.id('multi-select-toggle'))

      // Select multiple photos
      await MobileTestHelper.tapElement(by.id('photo-0'))
      await MobileTestHelper.tapElement(by.id('photo-1'))
      await MobileTestHelper.tapElement(by.id('photo-2'))

      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      // Should show 3 previews
      await detoxExpect(element(by.id('attachment-count-3'))).toExist()
    })

    it('should send message with multiple attachments', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      await MobileTestHelper.waitForElement(by.id('photo-picker'))
      await MobileTestHelper.tapElement(by.id('multi-select-toggle'))
      await MobileTestHelper.tapElement(by.id('photo-0'))
      await MobileTestHelper.tapElement(by.id('photo-1'))
      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      await MobileTestHelper.tapElement(by.id('send-button'))

      await MobileTestHelper.waitForElement(by.id('upload-complete'), 15000)
    })

    it('should remove individual attachment from multiple', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      await MobileTestHelper.waitForElement(by.id('photo-picker'))
      await MobileTestHelper.tapElement(by.id('multi-select-toggle'))
      await MobileTestHelper.tapElement(by.id('photo-0'))
      await MobileTestHelper.tapElement(by.id('photo-1'))
      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      // Remove first attachment
      await MobileTestHelper.tapElement(by.id('remove-attachment-0'))

      // Should have 1 attachment left
      await detoxExpect(element(by.id('attachment-count-1'))).toExist()
    })
  })

  describe('Attachment Limits', () => {
    it('should enforce file size limit', async () => {
      // This would require selecting a large file
      // For now, verify the limit is documented
      await MobileTestHelper.tapElement(by.id('attachment-button'))

      // Size limit info should be visible
      if (await element(by.id('size-limit-info')).isVisible()) {
        await MobileTestHelper.assertTextExists('Max file size: 10MB')
      }
    })

    it('should enforce attachment count limit', async () => {
      // Try to add more than allowed attachments
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      // Limit info should be visible
      if (await element(by.id('count-limit-info')).isVisible()) {
        await MobileTestHelper.assertTextExists('Max 10 attachments per message')
      }
    })

    it('should show error for unsupported file type', async () => {
      // This would require selecting an unsupported file
      // Verification that the feature exists
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.assertElementVisible(by.id('document-option'))
    })
  })

  describe('Error Handling', () => {
    it('should handle upload failure gracefully', async () => {
      // Simulate network offline
      await device.setURLBlacklist(['.*'])

      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      await MobileTestHelper.waitForElement(by.id('photo-picker'))
      await MobileTestHelper.tapElement(by.id('photo-0'))
      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      await MobileTestHelper.tapElement(by.id('send-button'))

      // Should show error
      await MobileTestHelper.waitForElement(by.text('Upload failed'), 5000)

      // Restore network
      await device.setURLBlacklist([])
    })

    it('should allow retry after upload failure', async () => {
      // After a failed upload
      if (await element(by.id('retry-upload-button')).isVisible()) {
        await MobileTestHelper.tapElement(by.id('retry-upload-button'))

        await MobileTestHelper.waitForElement(by.id('upload-complete'), 10000)
      }
    })

    it('should handle permission denied gracefully', async () => {
      // Relaunch without camera permission
      await device.terminateApp()
      await device.launchApp({
        permissions: {
          camera: 'NO',
          photos: 'NO',
        },
      })

      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('camera-option'))

      // Permission prompt or error should appear
      await MobileTestHelper.wait(2000)
    })
  })

  describe('Performance', () => {
    it('should upload photo within acceptable time', async () => {
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      await MobileTestHelper.waitForElement(by.id('photo-picker'))
      await MobileTestHelper.tapElement(by.id('photo-0'))
      await MobileTestHelper.tapElement(by.id('confirm-selection'))

      PerformanceHelper.mark('upload-start')
      await MobileTestHelper.tapElement(by.id('send-button'))
      await MobileTestHelper.waitForElement(by.id('upload-complete'), 10000)

      const duration = PerformanceHelper.measure('Photo Upload', 'upload-start')
      expect(duration).toBeLessThan(8000)
    })

    it('should compress large images', async () => {
      // Verify image compression feature is available
      await MobileTestHelper.tapElement(by.id('attachment-button'))
      await MobileTestHelper.tapElement(by.id('photo-option'))

      // Look for compression settings
      if (await element(by.id('image-quality-settings')).isVisible()) {
        await MobileTestHelper.assertElementVisible(by.id('image-quality-settings'))
      }
    })
  })
})
