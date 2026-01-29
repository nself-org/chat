use serde::{Deserialize, Serialize};
use tauri::Runtime;
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationOptions {
    pub title: String,
    pub body: Option<String>,
    pub icon: Option<String>,
    pub sound: Option<String>,
}

/// Show a native notification
#[tauri::command]
pub async fn show_notification<R: Runtime>(
    app: tauri::AppHandle<R>,
    options: NotificationOptions,
) -> Result<(), String> {
    let mut notification = app.notification()
        .builder()
        .title(&options.title);

    if let Some(body) = &options.body {
        notification = notification.body(body);
    }

    if let Some(icon) = &options.icon {
        notification = notification.icon(icon);
    }

    notification.show().map_err(|e| e.to_string())
}

/// Request notification permission
#[tauri::command]
pub async fn request_notification_permission<R: Runtime>(
    app: tauri::AppHandle<R>,
) -> Result<String, String> {
    match app.notification().request_permission() {
        Ok(permission) => {
            if permission {
                Ok("granted".to_string())
            } else {
                Ok("denied".to_string())
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

/// Check if notifications are permitted
#[tauri::command]
pub async fn is_notification_permitted<R: Runtime>(
    app: tauri::AppHandle<R>,
) -> Result<bool, String> {
    app.notification()
        .permission_state()
        .map(|state| state == tauri_plugin_notification::PermissionState::Granted)
        .map_err(|e| e.to_string())
}
