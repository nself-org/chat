/**
 * Deep Links / Protocol Handler
 *
 * Handles custom URL protocol (nchat://) for deep linking.
 * Allows external applications to open specific views in nchat.
 */

import { app, dialog } from 'electron';
import log from 'electron-log';
import { showMainWindow, getMainWindow } from './window';

const PROTOCOL = 'nchat';

interface DeepLinkRoute {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

// Register the protocol handler
export function registerProtocolHandler(): void {
  // Set as default protocol client
  if (!app.isDefaultProtocolClient(PROTOCOL)) {
    const success = app.setAsDefaultProtocolClient(PROTOCOL);
    if (success) {
      log.info(`Registered as default handler for ${PROTOCOL}://`);
    } else {
      log.warn(`Failed to register as default handler for ${PROTOCOL}://`);
    }
  }

  // Handle protocol on macOS (when app is already running)
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
  });

  // Handle protocol on Windows/Linux (passed as command line argument)
  const argv = process.argv;
  const urlArg = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));
  if (urlArg) {
    // Delay to ensure app is ready
    app.whenReady().then(() => {
      handleDeepLink(urlArg);
    });
  }

  log.info('Protocol handler initialized');
}

// Handle second instance (Windows/Linux)
export function handleSecondInstance(commandLine: string[]): void {
  const urlArg = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`));
  if (urlArg) {
    handleDeepLink(urlArg);
  } else {
    // Just show the window
    showMainWindow();
  }
}

function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    // Remove protocol
    const withoutProtocol = url.replace(`${PROTOCOL}://`, '');

    // Parse URL
    const urlObj = new URL(`http://localhost/${withoutProtocol}`);

    // Extract path and params
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const path = `/${pathParts.join('/')}`;

    // Extract route params (e.g., /channel/123 -> { channelId: '123' })
    const params: Record<string, string> = {};

    // Common route patterns
    if (pathParts[0] === 'channel' && pathParts[1]) {
      params.channelId = pathParts[1];
    } else if (pathParts[0] === 'dm' && pathParts[1]) {
      params.userId = pathParts[1];
    } else if (pathParts[0] === 'thread' && pathParts[1]) {
      params.threadId = pathParts[1];
    } else if (pathParts[0] === 'message' && pathParts[1]) {
      params.messageId = pathParts[1];
    }

    // Extract query params
    const query: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return { path, params, query };
  } catch (error) {
    log.error('Failed to parse deep link:', error);
    return null;
  }
}

export function handleDeepLink(url: string): void {
  log.info(`Handling deep link: ${url}`);

  const route = parseDeepLink(url);
  if (!route) {
    log.warn('Invalid deep link URL');
    return;
  }

  // Show the main window first
  showMainWindow();

  const mainWindow = getMainWindow();
  if (!mainWindow) {
    log.warn('Main window not available for deep link');
    return;
  }

  // Handle different routes
  switch (true) {
    case route.path.startsWith('/channel/'):
      navigateToChannel(route.params.channelId, route.query);
      break;

    case route.path.startsWith('/dm/'):
      navigateToDM(route.params.userId, route.query);
      break;

    case route.path.startsWith('/thread/'):
      navigateToThread(route.params.threadId, route.query);
      break;

    case route.path.startsWith('/message/'):
      navigateToMessage(route.params.messageId, route.query);
      break;

    case route.path === '/settings':
      navigateToSettings(route.query);
      break;

    case route.path === '/join':
      handleJoinInvite(route.query);
      break;

    case route.path === '/auth':
      handleAuthCallback(route.query);
      break;

    default:
      // Send generic navigation
      mainWindow.webContents.send('deeplink', route);
  }
}

function navigateToChannel(channelId: string, query: Record<string, string>): void {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  let path = `/chat/${channelId}`;

  // If there's a message to scroll to
  if (query.message) {
    path += `?message=${query.message}`;
  }

  mainWindow.webContents.send('navigate', path);
  log.info(`Navigating to channel: ${channelId}`);
}

function navigateToDM(userId: string, query: Record<string, string>): void {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  mainWindow.webContents.send('navigate', `/dm/${userId}`);
  log.info(`Navigating to DM: ${userId}`);
}

function navigateToThread(threadId: string, query: Record<string, string>): void {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  mainWindow.webContents.send('navigate', `/thread/${threadId}`);
  log.info(`Navigating to thread: ${threadId}`);
}

function navigateToMessage(messageId: string, query: Record<string, string>): void {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  mainWindow.webContents.send('navigate:message', { messageId, query });
  log.info(`Navigating to message: ${messageId}`);
}

function navigateToSettings(query: Record<string, string>): void {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  let path = '/settings';
  if (query.tab) {
    path += `/${query.tab}`;
  }

  mainWindow.webContents.send('navigate', path);
  log.info(`Navigating to settings`);
}

async function handleJoinInvite(query: Record<string, string>): Promise<void> {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  const inviteCode = query.code || query.invite;
  if (!inviteCode) {
    log.warn('Join invite missing code');
    return;
  }

  // Confirm with user
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'Join Workspace',
    message: 'You have been invited to join a workspace',
    detail: `Invite code: ${inviteCode}\n\nWould you like to join?`,
    buttons: ['Join', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    mainWindow.webContents.send('join:invite', { code: inviteCode });
    log.info(`Processing join invite: ${inviteCode}`);
  }
}

function handleAuthCallback(query: Record<string, string>): void {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  // Handle OAuth callback
  if (query.token || query.code) {
    mainWindow.webContents.send('auth:callback', query);
    log.info('Processing auth callback');
  }
}

export function generateDeepLink(type: string, id: string, query?: Record<string, string>): string {
  let url = `${PROTOCOL}://${type}/${id}`;

  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  return url;
}

export function unregisterProtocolHandler(): void {
  app.removeAsDefaultProtocolClient(PROTOCOL);
  log.info(`Unregistered protocol handler for ${PROTOCOL}://`);
}
