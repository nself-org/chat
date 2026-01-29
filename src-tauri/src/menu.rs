use tauri::{
    menu::{Menu, MenuBuilder, MenuItemBuilder, SubmenuBuilder, PredefinedMenuItem},
    App, Manager, Runtime,
};

pub fn setup_menu(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    // File menu
    let file_menu = SubmenuBuilder::new(handle, "File")
        .item(&MenuItemBuilder::with_id("new_message", "New Message")
            .accelerator("CmdOrCtrl+N")
            .build(handle)?)
        .item(&MenuItemBuilder::with_id("new_channel", "New Channel")
            .accelerator("CmdOrCtrl+Shift+N")
            .build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("preferences", "Preferences...")
            .accelerator("CmdOrCtrl+,")
            .build(handle)?)
        .separator()
        .item(&PredefinedMenuItem::close_window(handle, Some("Close Window"))?)
        .build()?;

    // Edit menu
    let edit_menu = SubmenuBuilder::new(handle, "Edit")
        .item(&PredefinedMenuItem::undo(handle, Some("Undo"))?)
        .item(&PredefinedMenuItem::redo(handle, Some("Redo"))?)
        .separator()
        .item(&PredefinedMenuItem::cut(handle, Some("Cut"))?)
        .item(&PredefinedMenuItem::copy(handle, Some("Copy"))?)
        .item(&PredefinedMenuItem::paste(handle, Some("Paste"))?)
        .item(&PredefinedMenuItem::select_all(handle, Some("Select All"))?)
        .separator()
        .item(&MenuItemBuilder::with_id("find", "Find...")
            .accelerator("CmdOrCtrl+F")
            .build(handle)?)
        .build()?;

    // View menu
    let view_menu = SubmenuBuilder::new(handle, "View")
        .item(&MenuItemBuilder::with_id("reload", "Reload")
            .accelerator("CmdOrCtrl+R")
            .build(handle)?)
        .item(&MenuItemBuilder::with_id("force_reload", "Force Reload")
            .accelerator("CmdOrCtrl+Shift+R")
            .build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("actual_size", "Actual Size")
            .accelerator("CmdOrCtrl+0")
            .build(handle)?)
        .item(&MenuItemBuilder::with_id("zoom_in", "Zoom In")
            .accelerator("CmdOrCtrl+=")
            .build(handle)?)
        .item(&MenuItemBuilder::with_id("zoom_out", "Zoom Out")
            .accelerator("CmdOrCtrl+-")
            .build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("toggle_sidebar", "Toggle Sidebar")
            .accelerator("CmdOrCtrl+\\")
            .build(handle)?)
        .item(&PredefinedMenuItem::fullscreen(handle, Some("Toggle Fullscreen"))?)
        .build()?;

    // Go menu
    let go_menu = SubmenuBuilder::new(handle, "Go")
        .item(&MenuItemBuilder::with_id("go_home", "Home")
            .accelerator("CmdOrCtrl+Shift+H")
            .build(handle)?)
        .item(&MenuItemBuilder::with_id("go_channels", "Channels")
            .accelerator("CmdOrCtrl+Shift+C")
            .build(handle)?)
        .item(&MenuItemBuilder::with_id("go_messages", "Direct Messages")
            .accelerator("CmdOrCtrl+Shift+M")
            .build(handle)?)
        .item(&MenuItemBuilder::with_id("go_threads", "Threads")
            .accelerator("CmdOrCtrl+Shift+T")
            .build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("go_settings", "Settings")
            .accelerator("CmdOrCtrl+Shift+S")
            .build(handle)?)
        .build()?;

    // Window menu
    let window_menu = SubmenuBuilder::new(handle, "Window")
        .item(&PredefinedMenuItem::minimize(handle, Some("Minimize"))?)
        .item(&MenuItemBuilder::with_id("zoom", "Zoom")
            .build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("bring_all_to_front", "Bring All to Front")
            .build(handle)?)
        .build()?;

    // Help menu
    let help_menu = SubmenuBuilder::new(handle, "Help")
        .item(&MenuItemBuilder::with_id("documentation", "Documentation")
            .build(handle)?)
        .item(&MenuItemBuilder::with_id("keyboard_shortcuts", "Keyboard Shortcuts")
            .accelerator("CmdOrCtrl+/")
            .build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("report_issue", "Report Issue")
            .build(handle)?)
        .item(&MenuItemBuilder::with_id("check_updates", "Check for Updates...")
            .build(handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("about", "About nchat")
            .build(handle)?)
        .build()?;

    // Build main menu
    #[cfg(target_os = "macos")]
    let menu = MenuBuilder::new(handle)
        .item(&SubmenuBuilder::new(handle, "nchat")
            .item(&PredefinedMenuItem::about(handle, Some("About nchat"), None)?)
            .separator()
            .item(&MenuItemBuilder::with_id("preferences", "Preferences...")
                .accelerator("CmdOrCtrl+,")
                .build(handle)?)
            .separator()
            .item(&PredefinedMenuItem::services(handle, Some("Services"))?)
            .separator()
            .item(&PredefinedMenuItem::hide(handle, Some("Hide nchat"))?)
            .item(&PredefinedMenuItem::hide_others(handle, Some("Hide Others"))?)
            .item(&PredefinedMenuItem::show_all(handle, Some("Show All"))?)
            .separator()
            .item(&PredefinedMenuItem::quit(handle, Some("Quit nchat"))?)
            .build()?)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&go_menu)
        .item(&window_menu)
        .item(&help_menu)
        .build()?;

    #[cfg(not(target_os = "macos"))]
    let menu = MenuBuilder::new(handle)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&go_menu)
        .item(&window_menu)
        .item(&help_menu)
        .build()?;

    app.set_menu(menu)?;

    // Handle menu events
    app.on_menu_event(|app, event| {
        let window = app.get_webview_window("main");

        match event.id().as_ref() {
            "new_message" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-new-message", ());
                }
            }
            "new_channel" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-new-channel", ());
                }
            }
            "preferences" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-preferences", ());
                }
            }
            "find" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-find", ());
                }
            }
            "reload" => {
                if let Some(w) = window {
                    let _ = w.eval("window.location.reload()");
                }
            }
            "force_reload" => {
                if let Some(w) = window {
                    let _ = w.eval("window.location.reload(true)");
                }
            }
            "toggle_sidebar" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-toggle-sidebar", ());
                }
            }
            "go_home" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-navigate", "home");
                }
            }
            "go_channels" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-navigate", "channels");
                }
            }
            "go_messages" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-navigate", "messages");
                }
            }
            "go_threads" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-navigate", "threads");
                }
            }
            "go_settings" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-navigate", "settings");
                }
            }
            "documentation" => {
                let _ = tauri::async_runtime::spawn(async {
                    let _ = open::that("https://docs.nself.org/nchat");
                });
            }
            "keyboard_shortcuts" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-keyboard-shortcuts", ());
                }
            }
            "report_issue" => {
                let _ = tauri::async_runtime::spawn(async {
                    let _ = open::that("https://github.com/nself/nself-chat/issues");
                });
            }
            "check_updates" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-check-updates", ());
                }
            }
            "about" => {
                if let Some(w) = window {
                    let _ = w.emit("menu-about", ());
                }
            }
            _ => {}
        }
    });

    Ok(())
}

/// Enable or disable a menu item
#[tauri::command]
pub async fn set_menu_item_enabled<R: Runtime>(
    app: tauri::AppHandle<R>,
    id: String,
    enabled: bool,
) -> Result<(), String> {
    if let Some(menu) = app.menu() {
        if let Some(item) = menu.get(&id) {
            if let Some(menu_item) = item.as_menuitem() {
                menu_item.set_enabled(enabled).map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}
