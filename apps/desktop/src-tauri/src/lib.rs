#![cfg_attr(mobile, tauri::mobile_entry_point)]

use std::process::Command;
use std::thread;
use std::time::Duration;

#[derive(serde::Serialize)]
pub struct TargetSnapshot {
    pub supported: bool,
    pub application: Option<String>,
}

#[tauri::command]
pub fn capture_active_target() -> TargetSnapshot {
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("osascript")
            .args([
                "-e",
                "tell application \"System Events\" to get name of first process whose frontmost is true",
            ])
            .output();

        return TargetSnapshot {
            supported: output.is_ok(),
            application: output
                .ok()
                .filter(|result| result.status.success())
                .map(|result| String::from_utf8_lossy(&result.stdout).trim().to_string())
                .filter(|name| !name.is_empty()),
        };
    }

    #[cfg(target_os = "windows")]
    {
        let script = r#"
Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class Foreground {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
'@
$hwnd = [Foreground]::GetForegroundWindow()
$pid = 0
[Foreground]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
if ($pid -gt 0) { (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName }
"#;
        let output = Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", script])
            .output();

        return TargetSnapshot {
            supported: output.is_ok(),
            application: output
                .ok()
                .filter(|result| result.status.success())
                .map(|result| String::from_utf8_lossy(&result.stdout).trim().to_string())
                .filter(|name| !name.is_empty()),
        };
    }

    #[cfg(target_os = "linux")]
    {
        let output = Command::new("sh")
            .args([
                "-lc",
                "if command -v xdotool >/dev/null 2>&1; then xdotool getactivewindow getwindowclassname; elif command -v swaymsg >/dev/null 2>&1; then swaymsg -t get_tree | grep -m1 'app_id' | cut -d'\"' -f4; fi",
            ])
            .output();

        return TargetSnapshot {
            supported: output.is_ok(),
            application: output
                .ok()
                .filter(|result| result.status.success())
                .map(|result| String::from_utf8_lossy(&result.stdout).trim().to_string())
                .filter(|name| !name.is_empty()),
        };
    }

    #[allow(unreachable_code)]
    TargetSnapshot {
        supported: false,
        application: None,
    }
}

#[tauri::command]
pub fn paste_text() -> Result<(), String> {
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
            Err("macOS paste failed; Accessibility permission may be required".into())
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

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![capture_active_target, paste_text])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running SAYRR desktop application");
}
