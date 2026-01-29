'use client';

/**
 * AudioRoom - Audio-only meeting room
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Meeting, RemoteParticipant, LocalUserState } from '@/lib/meetings/meeting-types';
import { MeetingControls } from './MeetingControls';
import { useMeetingStore, selectRoomState, selectLocalUser, selectRemoteParticipants } from '@/stores/meeting-store';
import {
  Phone,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface AudioRoomProps {
  meeting: Meeting;
  onLeave?: () => void;
  onEnd?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function AudioRoom({ meeting, onLeave, onEnd }: AudioRoomProps) {
  const roomState = useMeetingStore(selectRoomState);
  const localUser = useMeetingStore(selectLocalUser);
  const remoteParticipants = useMeetingStore(selectRemoteParticipants);
  const { setConnected, setConnectionError } = useMeetingStore();

  // Simulate connection
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setConnected(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [setConnected]);

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Connection states
  if (roomState?.isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="relative">
          <Phone className="h-16 w-16 mb-4" />
          <Loader2 className="h-6 w-6 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Connecting to audio...</h2>
        <p className="text-gray-400">{meeting.title}</p>
      </div>
    );
  }

  if (roomState?.connectionError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
        <p className="text-gray-400 mb-4">{roomState.connectionError}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onLeave}>
            Leave
          </Button>
          <Button onClick={() => setConnectionError(null)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const allParticipants = [
    // Local user as first
    {
      id: 'local',
      displayName: 'You',
      avatarUrl: null,
      isMuted: localUser?.isMuted ?? true,
      isSpeaking: false,
    },
    // Remote participants
    ...remoteParticipants.map((p) => ({
      id: p.peerId,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      isMuted: p.isMuted,
      isSpeaking: p.isSpeaking,
    })),
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="flex items-center justify-center py-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Phone className="h-5 w-5" />
            <h2 className="font-semibold">{meeting.title}</h2>
          </div>
          {meeting.status === 'live' && (
            <Badge className="bg-red-500 text-white animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
      </div>

      {/* Participants Grid */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
          {allParticipants.map((participant) => (
            <div
              key={participant.id}
              className="flex flex-col items-center"
            >
              {/* Avatar with speaking indicator */}
              <div className="relative">
                <Avatar
                  className={cn(
                    'h-24 w-24 border-4 transition-all',
                    participant.isSpeaking
                      ? 'border-green-500 ring-4 ring-green-500/30'
                      : 'border-gray-600'
                  )}
                >
                  <AvatarImage src={participant.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-gray-700">
                    {getInitials(participant.displayName)}
                  </AvatarFallback>
                </Avatar>

                {/* Mute indicator */}
                <div
                  className={cn(
                    'absolute -bottom-1 -right-1 h-8 w-8 rounded-full flex items-center justify-center',
                    participant.isMuted
                      ? 'bg-red-500'
                      : 'bg-green-500'
                  )}
                >
                  {participant.isMuted ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </div>

                {/* Speaking animation */}
                {participant.isSpeaking && !participant.isMuted && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
                )}
              </div>

              {/* Name */}
              <p className="mt-3 text-sm font-medium">
                {participant.displayName}
                {participant.id === 'local' && ' (You)'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Audio Visualizer Placeholder */}
      <div className="flex items-center justify-center gap-1 h-16 px-8">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-primary/60 rounded-full transition-all"
            style={{
              height: `${Math.random() * 32 + 8}px`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <MeetingControls
        meeting={meeting}
        variant="audio"
        onLeave={onLeave}
        onEnd={onEnd}
      />
    </div>
  );
}
