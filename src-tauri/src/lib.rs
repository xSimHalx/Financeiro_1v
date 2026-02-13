use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, State};

mod db;

struct AppState {
    db: Mutex<Option<rusqlite::Connection>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Transacao {
    id: String,
    date: String,
    description: Option<String>,
    client: Option<String>,
    value: f64,
    #[serde(rename = "type")]
    tipo: String,
    contexto: Option<String>,
    contraparte: Option<String>,
    category: Option<String>,
    account: Option<String>,
    metodo_pagamento: Option<String>,
    status: Option<String>,
    deleted: bool,
    recorrencia_id: Option<String>,
    updated_at: Option<String>,
}

#[tauri::command]
fn get_transacoes(state: State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::get_all_transacoes(c)
}

#[tauri::command]
fn delete_transacao(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::delete_transacao(c, &id)
}

#[tauri::command]
fn put_transacao(state: State<AppState>, tx: serde_json::Value) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::put_transacao(c, tx)
}

#[tauri::command]
fn put_transacoes(state: State<AppState>, items: Vec<serde_json::Value>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    for tx in items {
        let _ = db::put_transacao(c, tx);
    }
    Ok(())
}

#[tauri::command]
fn put_recorrentes(state: State<AppState>, items: Vec<serde_json::Value>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::put_recorrentes(c, items)
}

#[tauri::command]
fn get_recorrentes(state: State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::get_all_recorrentes(c)
}

#[tauri::command]
fn put_recorrencia(state: State<AppState>, r: serde_json::Value) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::put_recorrencia(c, r)
}

#[tauri::command]
fn get_config(state: State<AppState>) -> Result<serde_json::Value, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::get_config(c)
}

#[derive(serde::Deserialize)]
struct SetConfigPayload {
    key: String,
    value: String,
}

#[tauri::command]
fn set_config(state: State<AppState>, payload: SetConfigPayload) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::set_config(c, &payload.key, &payload.value)
}

#[tauri::command]
fn sync_pull(state: State<AppState>, token: Option<String>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::sync_pull(c, token)
}

#[tauri::command]
fn set_auth_token(state: State<AppState>, token: Option<String>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::set_auth_token(c, token.as_deref())
}

#[tauri::command]
fn sync_push(state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::sync_push(c)
}

#[tauri::command]
fn restore_from_cloud(state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let c = conn.as_ref().ok_or("DB not open")?;
    db::restore_from_cloud(c)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_path = std::env::current_dir()
        .ok()
        .map(|p| p.join("vertexads.db"))
        .unwrap_or_else(|| std::path::PathBuf::from("vertexads.db"));
    let conn = rusqlite::Connection::open(&db_path).ok();
    if let Some(ref c) = conn {
        let _ = db::migrate(c);
    }
    let state = AppState {
        db: Mutex::new(conn),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            get_transacoes,
            put_transacao,
            delete_transacao,
            put_transacoes,
            get_recorrentes,
            put_recorrencia,
            put_recorrentes,
            get_config,
            set_config,
            set_auth_token,
            sync_pull,
            sync_push,
            restore_from_cloud,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            for (label, win) in app.webview_windows() {
                let h = handle.clone();
                let lab = label.to_string();
                win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let handle_inner = h.clone();
                        let label_inner = lab.clone();
                        std::thread::spawn(move || {
                            if let Some(state) = handle_inner.try_state::<AppState>() {
                                if let Ok(guard) = state.db.lock() {
                                    if let Some(ref conn) = *guard {
                                        let _ = db::sync_push(conn);
                                    }
                                }
                            }
                            let handle_for_close = handle_inner.clone();
                            let _ = handle_inner.run_on_main_thread(move || {
                                if let Some(w) = handle_for_close.get_webview_window(&label_inner) {
                                    let _ = w.close();
                                }
                            });
                        });
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running tauri application");
}
