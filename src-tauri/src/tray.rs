use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    App, Manager, Runtime,
};

pub fn setup_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    // Build tray menu
    let tray_menu = MenuBuilder::new(handle)
        .item(&MenuItemBuilder::with_id("show", "Show nchat").build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("new_message", "New Message").build(handle)?)
        .item(&MenuItemBuilder::with_id("new_channel", "New Channel").build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("status_online", "Online").build(handle)?)
        .item(&MenuItemBuilder::with_id("status_away", "Away").build(handle)?)
        .item(&MenuItemBuilder::with_id("status_dnd", "Do Not Disturb").build(handle)?)
        .item(&MenuItemBuilder::with_id("status_invisible", "Invisible").build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("preferences", "Preferences...").build(handle)?)
        .separator()
        .item(&PredefinedMenuItem::quit(handle, Some("Quit nchat"))?)
        .build()?;

    // Load tray icon
    let icon = Image::from_path("icons/tray.png")
        .unwrap_or_else(|_| Image::from_bytes(include_bytes!("../icons/tray.png")).unwrap());

    // Build tray
    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .menu(&tray_menu)
        .tooltip("nchat")
        .on_menu_event(|app, event| {
            let window = app.get_webview_window("main");

            match event.id().as_ref() {
                "show" => {
                    if let Some(w) = window {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
                "new_message" => {
                    if let Some(w) = &window {
                        let _ = w.show();
                        let _ = w.set_focus();
                        let _ = w.emit("tray-new-message", ());
                    }
                }
                "new_channel" => {
                    if let Some(w) = &window {
                        let _ = w.show();
                        let _ = w.set_focus();
                        let _ = w.emit("tray-new-channel", ());
                    }
                }
                "status_online" => {
                    if let Some(w) = &window {
                        let _ = w.emit("tray-status-change", "online");
                    }
                }
                "status_away" => {
                    if let Some(w) = &window {
                        let _ = w.emit("tray-status-change", "away");
                    }
                }
                "status_dnd" => {
                    if let Some(w) = &window {
                        let _ = w.emit("tray-status-change", "dnd");
                    }
                }
                "status_invisible" => {
                    if let Some(w) = &window {
                        let _ = w.emit("tray-status-change", "invisible");
                    }
                }
                "preferences" => {
                    if let Some(w) = &window {
                        let _ = w.show();
                        let _ = w.set_focus();
                        let _ = w.emit("tray-preferences", ());
                    }
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            match event {
                tauri::tray::TrayIconEvent::Click {
                    button: tauri::tray::MouseButton::Left,
                    button_state: tauri::tray::MouseButtonState::Up,
                    ..
                } => {
                    // Toggle window visibility on left click
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
                tauri::tray::TrayIconEvent::DoubleClick {
                    button: tauri::tray::MouseButton::Left,
                    ..
                } => {
                    // Show window on double click
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

/// Update tray icon
#[tauri::command]
pub async fn update_tray_icon<R: Runtime>(
    app: tauri::AppHandle<R>,
    icon_type: String,
) -> Result<(), String> {
    let tray = app.tray_by_id("main").ok_or("Tray not found")?;

    let icon_path = match icon_type.as_str() {
        "unread" => "icons/tray-unread.png",
        "muted" => "icons/tray-muted.png",
        "dnd" => "icons/tray-dnd.png",
        _ => "icons/tray.png",
    };

    let icon = Image::from_path(icon_path)
        .map_err(|e| e.to_string())?;

    tray.set_icon(Some(icon)).map_err(|e| e.to_string())
}

/// Update tray tooltip
#[tauri::command]
pub async fn update_tray_tooltip<R: Runtime>(
    app: tauri::AppHandle<R>,
    tooltip: String,
) -> Result<(), String> {
    let tray = app.tray_by_id("main").ok_or("Tray not found")?;
    tray.set_tooltip(Some(&tooltip)).map_err(|e| e.to_string())
}
