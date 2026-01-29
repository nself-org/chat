use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

pub fn setup_shortcuts<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    // Register global shortcuts

    // Toggle window visibility: Cmd/Ctrl+Shift+Space
    let toggle_window_shortcut = "CmdOrCtrl+Shift+Space";
    app.global_shortcut().on_shortcut(toggle_window_shortcut, {
        let app_handle = app.clone();
        move || {
            log::debug!("Global shortcut triggered: toggle window");
            if let Some(window) = app_handle.get_webview_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
    })?;

    // Show window: Cmd/Ctrl+Shift+N
    let show_window_shortcut = "CmdOrCtrl+Shift+N";
    app.global_shortcut().on_shortcut(show_window_shortcut, {
        let app_handle = app.clone();
        move || {
            log::debug!("Global shortcut triggered: show window");
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    })?;

    // Quick voice call toggle: Cmd/Ctrl+Shift+V
    let voice_call_shortcut = "CmdOrCtrl+Shift+V";
    app.global_shortcut().on_shortcut(voice_call_shortcut, {
        let app_handle = app.clone();
        move || {
            log::debug!("Global shortcut triggered: voice call");
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.emit("shortcut-voice-call", ());
            }
        }
    })?;

    // Mute/unmute toggle: Cmd/Ctrl+Shift+M
    let mute_shortcut = "CmdOrCtrl+Shift+M";
    app.global_shortcut().on_shortcut(mute_shortcut, {
        let app_handle = app.clone();
        move || {
            log::debug!("Global shortcut triggered: mute toggle");
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.emit("shortcut-mute-toggle", ());
            }
        }
    })?;

    log::info!("Global shortcuts registered successfully");
    Ok(())
}

/// Register a custom global shortcut
#[tauri::command]
pub async fn register_shortcut<R: Runtime>(
    app: AppHandle<R>,
    shortcut: String,
    action: String,
) -> Result<(), String> {
    app.global_shortcut()
        .on_shortcut(&shortcut, move || {
            log::debug!("Custom shortcut triggered: {} -> {}", shortcut, action);
        })
        .map_err(|e| e.to_string())
}

/// Unregister a global shortcut
#[tauri::command]
pub async fn unregister_shortcut<R: Runtime>(
    app: AppHandle<R>,
    shortcut: String,
) -> Result<(), String> {
    app.global_shortcut()
        .unregister(&shortcut)
        .map_err(|e| e.to_string())
}

/// Check if a shortcut is registered
#[tauri::command]
pub async fn is_shortcut_registered<R: Runtime>(
    app: AppHandle<R>,
    shortcut: String,
) -> Result<bool, String> {
    app.global_shortcut()
        .is_registered(&shortcut)
        .map_err(|e| e.to_string())
}
