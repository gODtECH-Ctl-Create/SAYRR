#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::thread;
use std::time::Duration;

use tauri::Manager;

#[tauri::command]
fn paste_text() -> Result<(), String> {
    thread::sleep(Duration::from_millis(80));

    #[cfg(target_os = "macos")]
    {
        let status = Command::new("osascript")
            .args([
                "-e",
                "tell application \"System Events\" to keystroke \"v\" using {command down}",
            ])
            .status()
            .map_err(|error| format!("failed to invoke macOS paste: {error}"))?;

        return if status.success() {
            Ok(())
        } else {
            Err("macOS paste command failed; accessibility permission may be required".into())
        };
    }

    #[cfg(target_os = "windows")]
    {
        let script = "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')";
        let status = Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", script])
            .status()
            .map_err(|error| format!("failed to invoke Windows paste: {error}"))?;

        return if status.success() {
            Ok(())
        } else {
            Err("Windows paste command failed".into())
        };
    }

    #[cfg(target_os = "linux")]
    {
        let xdotool = Command::new("xdotool")
            .args(["key", "--clearmodifiers", "ctrl+v"])
            .status();

        if xdotool.is_ok_and(|status| status.success()) {
            return Ok(());
        }

        let wtype = Command::new("wtype")
            .args(["-M", "CTRL", "-k", "v", "-m", "CTRL"])
            .status();

        return if wtype.is_ok_and(|status| status.success()) {
            Ok(())
        } else {
            Err("Linux paste fallback unavailable; install xdotool or wtype".into())
        };
    }

    #[allow(unreachable_code)]
    Err("Direct paste is not implemented for this operating system yet".into())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![paste_text])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running SAYRR desktop application");
}
