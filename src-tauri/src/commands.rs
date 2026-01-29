use tauri::{AppHandle, Manager, Runtime};

/// Greet command for testing
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to nchat.", name)
}

/// Get application version
#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Get current platform
#[tauri::command]
pub fn get_platform() -> String {
    #[cfg(target_os = "macos")]
    return "macos".to_string();

    #[cfg(target_os = "windows")]
    return "windows".to_string();

    #[cfg(target_os = "linux")]
    return "linux".to_string();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    return "unknown".to_string()
}

/// Show the main window
#[tauri::command]
pub async fn show_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Hide the main window
#[tauri::command]
pub async fn hide_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Minimize the main window
#[tauri::command]
pub async fn minimize_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Maximize the main window
#[tauri::command]
pub async fn maximize_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_maximized().map_err(|e| e.to_string())? {
            window.unmaximize().map_err(|e| e.to_string())?;
        } else {
            window.maximize().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Close the main window
#[tauri::command]
pub async fn close_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Set badge count (macOS dock badge)
#[tauri::command]
pub fn set_badge_count(count: i32) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        if count > 0 {
            let script = format!(
                r#"tell application "System Events" to set badge of dock tile of application "nchat" to "{}""#,
                count
            );
            Command::new("osascript")
                .args(["-e", &script])
                .output()
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Clear badge count
#[tauri::command]
pub fn clear_badge() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let script = r#"tell application "System Events" to set badge of dock tile of application "nchat" to """#;
        Command::new("osascript")
            .args(["-e", script])
            .output()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Focus the main window
#[tauri::command]
pub async fn focus_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Check if window is focused
#[tauri::command]
pub async fn is_focused<R: Runtime>(app: AppHandle<R>) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("main") {
        window.is_focused().map_err(|e| e.to_string())
    } else {
        Ok(false)
    }
}
