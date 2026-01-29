'use client';

/**
 * MeetingControls - Audio/video controls for meeting rooms
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Meeting } from '@/lib/meetings/meeting-types';
import {
  useMeetingStore,
  selectLocalUser,
  selectRoomState,
} from '@/stores/meeting-store';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Hand,
  PhoneOff,
  MoreVertical,
  Settings,
  Disc,
  StopCircle,
  ChevronUp,
  Volume2,
  VolumeX,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface MeetingControlsProps {
  meeting: Meeting;
  variant?: 'default' | 'audio';
  onLeave?: () => void;
  onEnd?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function MeetingControls({
  meeting,
  variant = 'default',
  onLeave,
  onEnd,
}: MeetingControlsProps) {
  const localUser = useMeetingStore(selectLocalUser);
  const roomState = useMeetingStore(selectRoomState);
  const {
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
  } = useMeetingStore();

  const isMuted = localUser?.isMuted ?? true;
  const isVideoOn = localUser?.isVideoOn ?? false;
  const isScreenSharing = localUser?.isScreenSharing ?? false;
  const isHandRaised = localUser?.isHandRaised ?? false;
  const isRecording = roomState?.recordingStatus === 'recording';
  const isHost = true; // Would check against current user

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-2 px-4 py-4 bg-gray-800/80 backdrop-blur border-t border-gray-700">
        {/* Audio Control */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <DropdownMenu>
                <div className="flex items-center">
                  <Button
                    variant={isMuted ? 'destructive' : 'secondary'}
                    size="lg"
                    className={cn(
                      'rounded-full h-12 w-12',
                      !isMuted && 'bg-gray-700 hover:bg-gray-600'
                    )}
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 -ml-2 rounded-full bg-gray-600 hover:bg-gray-500"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Audio Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    Microphone
                  </div>
                  <DropdownMenuItem>Default Microphone</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    Speaker
                  </div>
                  <DropdownMenuItem>Default Speaker</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isMuted ? 'Unmute' : 'Mute'}
          </TooltipContent>
        </Tooltip>

        {/* Video Control (not shown for audio-only) */}
        {variant !== 'audio' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <DropdownMenu>
                  <div className="flex items-center">
                    <Button
                      variant={!isVideoOn ? 'destructive' : 'secondary'}
                      size="lg"
                      className={cn(
                        'rounded-full h-12 w-12',
                        isVideoOn && 'bg-gray-700 hover:bg-gray-600'
                      )}
                      onClick={toggleVideo}
                    >
                      {isVideoOn ? (
                        <Video className="h-5 w-5" />
                      ) : (
                        <VideoOff className="h-5 w-5" />
                      )}
                    </Button>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 -ml-2 rounded-full bg-gray-600 hover:bg-gray-500"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </div>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Video Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      Camera
                    </div>
                    <DropdownMenuItem>Default Camera</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Screen Share (not shown for audio-only) */}
        {variant !== 'audio' && meeting.settings.allowScreenShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? 'default' : 'secondary'}
                size="lg"
                className={cn(
                  'rounded-full h-12 w-12',
                  !isScreenSharing && 'bg-gray-700 hover:bg-gray-600',
                  isScreenSharing && 'bg-green-600 hover:bg-green-700'
                )}
                onClick={toggleScreenShare}
              >
                {isScreenSharing ? (
                  <MonitorOff className="h-5 w-5" />
                ) : (
                  <MonitorUp className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isScreenSharing ? 'Stop sharing' : 'Share screen'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Raise Hand */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isHandRaised ? 'default' : 'secondary'}
              size="lg"
              className={cn(
                'rounded-full h-12 w-12',
                !isHandRaised && 'bg-gray-700 hover:bg-gray-600',
                isHandRaised && 'bg-yellow-600 hover:bg-yellow-700'
              )}
              onClick={toggleHandRaise}
            >
              <Hand className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isHandRaised ? 'Lower hand' : 'Raise hand'}
          </TooltipContent>
        </Tooltip>

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full h-12 w-12 bg-gray-700 hover:bg-gray-600"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            {isHost && meeting.settings.allowRecording && (
              <>
                <DropdownMenuItem onClick={() => console.log('Toggle recording')}>
                  {isRecording ? (
                    <>
                      <StopCircle className="h-4 w-4 mr-2 text-red-500" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Disc className="h-4 w-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Meeting Settings
            </DropdownMenuItem>
            {isHost && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500" onClick={onEnd}>
                  End Meeting for All
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Spacer */}
        <div className="w-px h-8 bg-gray-600 mx-2" />

        {/* Leave Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-12 px-6"
              onClick={onLeave}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Leave
            </Button>
          </TooltipTrigger>
          <TooltipContent>Leave meeting</TooltipContent>
        </Tooltip>

        {/* Recording Indicator */}
        {isRecording && (
          <Badge className="absolute top-4 left-4 bg-red-500 text-white animate-pulse">
            <Disc className="h-3 w-3 mr-1 animate-spin" />
            Recording
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
