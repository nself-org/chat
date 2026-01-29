/**
 * Share Integration for Capacitor
 * Native share functionality for text, URLs, and files
 */

import { Share, ShareOptions, ShareResult } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

class ShareService {
  private isAvailable = false;

  constructor() {
    this.checkAvailability();
  }

  /**
   * Check if sharing is available
   */
  private async checkAvailability(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      this.isAvailable = false;
      return;
    }

    try {
      const result = await Share.canShare();
      this.isAvailable = result.value;
    } catch (error) {
      console.error('Error checking share availability:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Share text content
   */
  async shareText(text: string, title?: string): Promise<ShareResult | null> {
    if (!this.isAvailable) {
      console.warn('Share not available');
      return null;
    }

    try {
      const options: ShareOptions = {
        text,
        title: title || 'Share',
        dialogTitle: title || 'Share',
      };

      const result = await Share.share(options);
      return result;
    } catch (error) {
      console.error('Error sharing text:', error);
      return null;
    }
  }

  /**
   * Share URL
   */
  async shareUrl(url: string, title?: string, text?: string): Promise<ShareResult | null> {
    if (!this.isAvailable) {
      console.warn('Share not available');
      return null;
    }

    try {
      const options: ShareOptions = {
        url,
        title: title || 'Share',
        text: text || url,
        dialogTitle: title || 'Share',
      };

      const result = await Share.share(options);
      return result;
    } catch (error) {
      console.error('Error sharing URL:', error);
      return null;
    }
  }

  /**
   * Share file
   */
  async shareFile(
    filePath: string,
    mimeType: string,
    title?: string
  ): Promise<ShareResult | null> {
    if (!this.isAvailable) {
      console.warn('Share not available');
      return null;
    }

    try {
      const options: ShareOptions = {
        files: [filePath],
        title: title || 'Share File',
        dialogTitle: title || 'Share File',
      };

      const result = await Share.share(options);
      return result;
    } catch (error) {
      console.error('Error sharing file:', error);
      return null;
    }
  }

  /**
   * Share multiple files
   */
  async shareFiles(
    filePaths: string[],
    title?: string
  ): Promise<ShareResult | null> {
    if (!this.isAvailable) {
      console.warn('Share not available');
      return null;
    }

    try {
      const options: ShareOptions = {
        files: filePaths,
        title: title || 'Share Files',
        dialogTitle: title || 'Share Files',
      };

      const result = await Share.share(options);
      return result;
    } catch (error) {
      console.error('Error sharing files:', error);
      return null;
    }
  }

  /**
   * Share message (text + URL)
   */
  async shareMessage(
    message: string,
    url?: string,
    title?: string
  ): Promise<ShareResult | null> {
    if (!this.isAvailable) {
      console.warn('Share not available');
      return null;
    }

    try {
      const options: ShareOptions = {
        text: message,
        url,
        title: title || 'Share Message',
        dialogTitle: title || 'Share Message',
      };

      const result = await Share.share(options);
      return result;
    } catch (error) {
      console.error('Error sharing message:', error);
      return null;
    }
  }

  /**
   * Share image
   */
  async shareImage(
    imagePath: string,
    text?: string,
    title?: string
  ): Promise<ShareResult | null> {
    return this.shareFile(imagePath, 'image/*', title);
  }

  /**
   * Share video
   */
  async shareVideo(
    videoPath: string,
    text?: string,
    title?: string
  ): Promise<ShareResult | null> {
    return this.shareFile(videoPath, 'video/*', title);
  }

  /**
   * Share channel invite
   */
  async shareChannelInvite(
    channelName: string,
    inviteUrl: string
  ): Promise<ShareResult | null> {
    return this.shareMessage(
      `Join ${channelName} on nChat!`,
      inviteUrl,
      `Invite to ${channelName}`
    );
  }

  /**
   * Share app
   */
  async shareApp(): Promise<ShareResult | null> {
    const appUrl = 'https://nchat.nself.org'; // Update with actual app URL
    return this.shareMessage(
      'Check out nChat - Team communication made easy!',
      appUrl,
      'Share nChat'
    );
  }

  /**
   * Check if share is available
   */
  isShareAvailable(): boolean {
    return this.isAvailable;
  }
}

// Export singleton instance
export const share = new ShareService();
