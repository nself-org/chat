mod commands;
mod menu;
mod tray;
mod notifications;
mod autostart;
mod deeplink;
mod updater;

use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_log::{Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .setup(|app| {
            // Initialize tray
            tray::setup_tray(app)?;

            // Initialize menu
            menu::setup_menu(app)?;

            // Initialize deep links
            deeplink::setup_deep_links(app)?;

            // Initialize updater
            updater::setup_updater(app)?;

            // Get main window
            let main_window = app.get_webview_window("main")
                .expect("Main window not found");

            // macOS: Make window transparent titlebar work properly
            #[cfg(target_os = "macos")]
            {
                use tauri::TitleBarStyle;
                main_window.set_title_bar_style(TitleBarStyle::Transparent)?;
            }

            log::info!("nchat desktop app initialized");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::get_app_version,
            commands::get_platform,
            commands::show_window,
            commands::hide_window,
            commands::minimize_window,
            commands::maximize_window,
            commands::close_window,
            commands::set_badge_count,
            commands::clear_badge,
            commands::focus_window,
            commands::is_focused,
            notifications::show_notification,
            notifications::request_notification_permission,
            notifications::is_notification_permitted,
            autostart::enable_autostart,
            autostart::disable_autostart,
            autostart::is_autostart_enabled,
            updater::check_for_updates,
            updater::install_update,
            tray::update_tray_icon,
            tray::update_tray_tooltip,
            menu::set_menu_item_enabled,
        ])
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Hide instead of close on macOS
                    #[cfg(target_os = "macos")]
                    {
                        window.hide().unwrap();
                        api.prevent_close();
                    }
                }
                tauri::WindowEvent::Focused(focused) => {
                    if *focused {
                        log::debug!("Window focused");
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
