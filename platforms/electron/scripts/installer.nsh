# Custom NSIS installer script for nchat
# Provides advanced installation features

# Protocol handler registration
!macro customInstall
  # Register nchat:// protocol
  WriteRegStr HKCU "Software\Classes\nchat" "" "URL:nchat Protocol"
  WriteRegStr HKCU "Software\Classes\nchat" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\nchat\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr HKCU "Software\Classes\nchat\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  
  # Add to Windows startup (optional, can be toggled in app)
  # WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "nchat" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --hidden'
!macroend

# Cleanup protocol handler on uninstall
!macro customUnInstall
  # Remove protocol handler
  DeleteRegKey HKCU "Software\Classes\nchat"
  
  # Remove from startup
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "nchat"
!macroend

# Custom pages (future expansion)
!macro customHeader
  # Show custom branding or welcome message
!macroend

# Installation directory validation
!macro preInit
  # Check for previous installation
  ReadRegStr $0 HKCU "Software\nchat" "InstallLocation"
  ${If} $0 != ""
    StrCpy $INSTDIR $0
  ${EndIf}
!macroend
