use tauri::{App, Listener, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

pub fn setup_deep_links(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle().clone();

    // Register deep link handler
    app.deep_link().on_open_url(move |event| {
        let urls = event.urls();

        for url in urls {
            log::info!("Deep link received: {}", url);

            // Parse the URL and route accordingly
            if let Some(window) = handle.get_webview_window("main") {
                // Show and focus the window
                let _ = window.show();
                let _ = window.set_focus();

                // Emit event to frontend with the URL
                let _ = window.emit("deep-link", url.to_string());

                // Parse URL path and route
                if let Some(path) = url.path().strip_prefix('/') {
                    match path {
                        p if p.starts_with("channel/") => {
                            let channel_id = p.strip_prefix("channel/").unwrap_or("");
                            let _ = window.emit("navigate-channel", channel_id);
                        }
                        p if p.starts_with("message/") => {
                            let message_id = p.strip_prefix("message/").unwrap_or("");
                            let _ = window.emit("navigate-message", message_id);
                        }
                        p if p.starts_with("user/") => {
                            let user_id = p.strip_prefix("user/").unwrap_or("");
                            let _ = window.emit("navigate-user", user_id);
                        }
                        p if p.starts_with("thread/") => {
                            let thread_id = p.strip_prefix("thread/").unwrap_or("");
                            let _ = window.emit("navigate-thread", thread_id);
                        }
                        "settings" => {
                            let _ = window.emit("menu-navigate", "settings");
                        }
                        "auth/callback" => {
                            // Handle OAuth callback
                            let _ = window.emit("auth-callback", url.to_string());
                        }
                        _ => {
                            log::warn!("Unknown deep link path: {}", path);
                        }
                    }
                }
            }
        }
    });

    // Register the deep link scheme
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        app.deep_link().register("nchat")?;
    }

    Ok(())
}
