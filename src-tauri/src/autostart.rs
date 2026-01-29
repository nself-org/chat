use tauri::Runtime;
use tauri_plugin_autostart::ManagerExt;

/// Enable auto-start on login
#[tauri::command]
pub async fn enable_autostart<R: Runtime>(app: tauri::AppHandle<R>) -> Result<(), String> {
    app.autolaunch()
        .enable()
        .map_err(|e| e.to_string())
}

/// Disable auto-start on login
#[tauri::command]
pub async fn disable_autostart<R: Runtime>(app: tauri::AppHandle<R>) -> Result<(), String> {
    app.autolaunch()
        .disable()
        .map_err(|e| e.to_string())
}

/// Check if auto-start is enabled
#[tauri::command]
pub async fn is_autostart_enabled<R: Runtime>(app: tauri::AppHandle<R>) -> Result<bool, String> {
    app.autolaunch()
        .is_enabled()
        .map_err(|e| e.to_string())
}
