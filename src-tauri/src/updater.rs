use serde::{Deserialize, Serialize};
use tauri::{App, Manager, Runtime};
use tauri_plugin_updater::UpdaterExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub body: Option<String>,
    pub date: Option<String>,
}

pub fn setup_updater(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle().clone();

    // Check for updates on startup (in background)
    tauri::async_runtime::spawn(async move {
        // Wait a bit before checking
        tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;

        if let Ok(updater) = handle.updater() {
            match updater.check().await {
                Ok(Some(update)) => {
                    log::info!("Update available: {}", update.version);

                    if let Some(window) = handle.get_webview_window("main") {
                        let info = UpdateInfo {
                            version: update.version.clone(),
                            current_version: update.current_version.clone(),
                            body: update.body.clone(),
                            date: update.date.map(|d| d.to_string()),
                        };
                        let _ = window.emit("update-available", info);
                    }
                }
                Ok(None) => {
                    log::info!("No updates available");
                }
                Err(e) => {
                    log::error!("Failed to check for updates: {}", e);
                }
            }
        }
    });

    Ok(())
}

/// Check for updates manually
#[tauri::command]
pub async fn check_for_updates<R: Runtime>(
    app: tauri::AppHandle<R>,
) -> Result<Option<UpdateInfo>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(Some(update)) => {
            let info = UpdateInfo {
                version: update.version.clone(),
                current_version: update.current_version.clone(),
                body: update.body.clone(),
                date: update.date.map(|d| d.to_string()),
            };

            // Emit event to frontend
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("update-available", info.clone());
            }

            Ok(Some(info))
        }
        Ok(None) => {
            // Emit no-update event
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("no-update-available", ());
            }
            Ok(None)
        }
        Err(e) => Err(e.to_string()),
    }
}

/// Install the pending update
#[tauri::command]
pub async fn install_update<R: Runtime>(app: tauri::AppHandle<R>) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(Some(update)) => {
            // Emit download start event
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("update-download-start", ());
            }

            // Download and install
            let mut downloaded: u64 = 0;
            let total_size = update.download_size();

            update
                .download_and_install(
                    |chunk_length, content_length| {
                        downloaded += chunk_length as u64;
                        let progress = if let Some(total) = content_length {
                            (downloaded as f64 / total as f64) * 100.0
                        } else if let Some(size) = total_size {
                            (downloaded as f64 / size as f64) * 100.0
                        } else {
                            0.0
                        };

                        // Emit progress (handled in the closure, can't easily emit here)
                        log::debug!("Download progress: {:.1}%", progress);
                    },
                    || {
                        log::info!("Update downloaded, restarting...");
                    },
                )
                .await
                .map_err(|e| e.to_string())?;

            Ok(())
        }
        Ok(None) => Err("No update available".to_string()),
        Err(e) => Err(e.to_string()),
    }
}
