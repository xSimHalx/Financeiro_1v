use rusqlite::{params, Connection};
use serde_json::Value;

const API_URL: &str = ""; // set via env TAURI_APP_CLOUD_API_URL or build

fn api_url() -> String {
    std::env::var("TAURI_APP_CLOUD_API_URL").unwrap_or_else(|_| API_URL.to_string())
}

pub fn migrate(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS transacoes (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            description TEXT,
            client TEXT,
            value REAL NOT NULL,
            type TEXT NOT NULL,
            contexto TEXT,
            contraparte TEXT,
            category TEXT,
            account TEXT,
            metodo_pagamento TEXT,
            status TEXT,
            deleted INTEGER NOT NULL DEFAULT 0,
            recorrencia_id TEXT,
            updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS recorrentes (
            id TEXT PRIMARY KEY,
            titulo TEXT,
            valor REAL,
            tipo TEXT,
            categoria TEXT,
            conta TEXT,
            metodo_pagamento TEXT,
            dia_vencimento INTEGER,
            ativo INTEGER,
            updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT
        );
        "#,
    )?;
    Ok(())
}

fn row_to_json(row: &rusqlite::Row) -> Result<Value, rusqlite::Error> {
    let mut map = serde_json::Map::new();
    for (i, name) in row.as_ref().column_names().iter().enumerate() {
        let v = row.get::<_, rusqlite::types::Value>(i)?;
        let j = match v {
            rusqlite::types::Value::Null => Value::Null,
            rusqlite::types::Value::Integer(n) => Value::Number(serde_json::Number::from(n)),
            rusqlite::types::Value::Real(f) => serde_json::Number::from_f64(f).map(Value::Number).unwrap_or(Value::Null),
            rusqlite::types::Value::Text(s) => Value::String(s),
            rusqlite::types::Value::Blob(_) => Value::Null,
        };
        map.insert(name.to_string(), j);
    }
    Ok(Value::Object(map))
}

pub fn get_all_transacoes(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare("SELECT id, data as date, description, client, value, type, contexto, contraparte, category, account, metodo_pagamento as metodoPagamento, status, deleted, recorrencia_id as recorrenciaId, updated_at as updatedAt FROM transacoes ORDER BY data DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| row_to_json(row)).map_err(|e| e.to_string())?;
    let mut out = vec![];
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

pub fn delete_transacao(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM transacoes WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn put_transacao(conn: &Connection, tx: Value) -> Result<(), String> {
    let obj = tx.as_object().ok_or("expected object")?;
    let id = obj.get("id").and_then(|v| v.as_str()).unwrap_or("");
    let date = obj.get("date").and_then(|v| v.as_str()).unwrap_or("");
    let description = obj.get("description").and_then(|v| v.as_str());
    let client = obj.get("client").and_then(|v| v.as_str());
    let value = obj.get("value").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let tipo = obj.get("type").and_then(|v| v.as_str()).unwrap_or("saida");
    let contexto = obj.get("contexto").and_then(|v| v.as_str());
    let contraparte = obj.get("contraparte").and_then(|v| v.as_str());
    let category = obj.get("category").and_then(|v| v.as_str());
    let account = obj.get("account").and_then(|v| v.as_str());
    let metodo_pagamento = obj.get("metodoPagamento").and_then(|v| v.as_str());
    let status = obj.get("status").and_then(|v| v.as_str());
    let deleted = obj.get("deleted").and_then(|v| v.as_bool()).unwrap_or(false);
    let recorrencia_id = obj.get("recorrenciaId").and_then(|v| v.as_str());
    let updated_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .ok()
        .map(|d| d.as_secs().to_string());
    conn.execute(
        r#"INSERT OR REPLACE INTO transacoes (id, data, description, client, value, type, contexto, contraparte, category, account, metodo_pagamento, status, deleted, recorrencia_id, updated_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)"#,
        params![id, date, description, client, value, tipo, contexto, contraparte, category, account, metodo_pagamento, status, if deleted { 1i32 } else { 0i32 }, recorrencia_id, updated_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_all_recorrentes(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare("SELECT * FROM recorrentes").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| row_to_json(row)).map_err(|e| e.to_string())?;
    let mut out = vec![];
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

pub fn put_recorrentes(conn: &Connection, items: Vec<Value>) -> Result<(), String> {
    for r in items {
        put_recorrencia(conn, r)?;
    }
    Ok(())
}

pub fn put_recorrencia(conn: &Connection, r: Value) -> Result<(), String> {
    let obj = r.as_object().ok_or("expected object")?;
    let id = obj.get("id").and_then(|v| v.as_str()).unwrap_or("");
    let titulo = obj.get("titulo").and_then(|v| v.as_str());
    let valor = obj.get("valor").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let tipo = obj.get("tipo").and_then(|v| v.as_str());
    let categoria = obj.get("categoria").and_then(|v| v.as_str());
    let conta = obj.get("conta").and_then(|v| v.as_str());
    let metodo_pagamento = obj.get("metodoPagamento").and_then(|v| v.as_str());
    let dia_vencimento = obj.get("diaVencimento").and_then(|v| v.as_i64());
    let ativo = obj.get("ativo").and_then(|v| v.as_bool()).unwrap_or(true);
    let updated_at = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs().to_string());
    conn.execute(
        r#"INSERT OR REPLACE INTO recorrentes (id, titulo, valor, tipo, categoria, conta, metodo_pagamento, dia_vencimento, ativo, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)"#,
        params![id, titulo, valor, tipo, categoria, conta, metodo_pagamento, dia_vencimento, if ativo { 1i32 } else { 0i32 }, updated_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_config(conn: &Connection) -> Result<Value, String> {
    let mut map = serde_json::Map::new();
    let categorias: String = conn.query_row("SELECT value FROM config WHERE key = 'categorias'", [], |r| r.get(0)).unwrap_or_else(|_| "[]".to_string());
    let contas: String = conn.query_row("SELECT value FROM config WHERE key = 'contas'", [], |r| r.get(0)).unwrap_or_else(|_| "[]".to_string());
    let contas_investimento: String = conn.query_row("SELECT value FROM config WHERE key = 'contasInvestimento'", [], |r| r.get(0)).unwrap_or_else(|_| "[]".to_string());
    let last_synced: Option<String> = conn.query_row("SELECT value FROM config WHERE key = 'lastSyncedAt'", [], |r| r.get(0)).ok();
    map.insert("categorias".to_string(), serde_json::from_str(&categorias).unwrap_or(Value::Array(vec![])));
    map.insert("contas".to_string(), serde_json::from_str(&contas).unwrap_or(Value::Array(vec![])));
    map.insert("contasInvestimento".to_string(), serde_json::from_str(&contas_investimento).unwrap_or(Value::Array(vec![])));
    map.insert("lastSyncedAt".to_string(), last_synced.map(Value::String).unwrap_or(Value::Null));
    Ok(Value::Object(map))
}

pub fn set_config(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    let updated_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .ok()
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|| "0".to_string());
    conn.execute(
        "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?1, ?2, ?3)",
        params![key, value, updated_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn tx_to_api(t: &Value) -> Value {
    t.clone()
}

pub fn sync_pull(conn: &Connection) -> Result<(), String> {
    let url = api_url();
    if url.is_empty() {
        return Ok(());
    }
    let config = get_config(conn)?;
    let since = config
        .get("lastSyncedAt")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let request_url = if since.is_empty() {
        format!("{}/sync", url.trim_end_matches('/'))
    } else {
        format!("{}/sync?since={}", url.trim_end_matches('/'), urlencoding::encode(since))
    };
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let res = client.get(&request_url).send().map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("sync pull failed: {}", res.status()));
    }
    let data: Value = res.json().map_err(|e| e.to_string())?;
    if let Some(arr) = data.get("transacoes").and_then(|v| v.as_array()) {
        for t in arr {
            let _ = put_transacao(conn, tx_to_api(t));
        }
    }
    if let Some(arr) = data.get("recorrentes").and_then(|v| v.as_array()) {
        for r in arr {
            let _ = put_recorrencia(conn, r.clone());
        }
    }
    if let Some(cfg) = data.get("config") {
        if let Some(cats) = cfg.get("categorias") {
            let _ = set_config(conn, "categorias", &cats.to_string());
        }
        if let Some(contas) = cfg.get("contas") {
            let _ = set_config(conn, "contas", &contas.to_string());
        }
        if let Some(ci) = cfg.get("contasInvestimento") {
            let _ = set_config(conn, "contasInvestimento", &ci.to_string());
        }
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .ok()
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|| "0".to_string());
    let _ = set_config(conn, "lastSyncedAt", &now);
    Ok(())
}

pub fn sync_push(conn: &Connection) -> Result<(), String> {
    let url = api_url();
    if url.is_empty() {
        return Ok(());
    }
    let transacoes = get_all_transacoes(conn)?;
    let recorrentes = get_all_recorrentes(conn)?;
    let config = get_config(conn)?;
    let categorias = config.get("categorias").cloned().unwrap_or(Value::Array(vec![]));
    let contas = config.get("contas").cloned().unwrap_or(Value::Array(vec![]));
    let contas_investimento = config.get("contasInvestimento").cloned().unwrap_or(Value::Array(vec![]));
    let body = serde_json::json!({
        "transacoes": transacoes,
        "recorrentes": recorrentes,
        "config": { "categorias": categorias, "contas": contas, "contasInvestimento": contas_investimento }
    });
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let res = client
        .post(format!("{}/sync", url.trim_end_matches('/')))
        .json(&body)
        .send()
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("sync push failed: {}", res.status()));
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .ok()
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|| "0".to_string());
    let _ = set_config(conn, "lastSyncedAt", &now);
    Ok(())
}

pub fn restore_from_cloud(conn: &Connection) -> Result<(), String> {
    let url = api_url();
    if url.is_empty() {
        return Err("API URL não configurada. Defina TAURI_APP_CLOUD_API_URL.".to_string());
    }
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let res = client
        .get(format!("{}/sync", url.trim_end_matches('/')))
        .send()
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("restore failed: {}", res.status()));
    }
    let data: Value = res.json().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM transacoes", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM recorrentes", []).map_err(|e| e.to_string())?;
    if let Some(arr) = data.get("transacoes").and_then(|v| v.as_array()) {
        for t in arr {
            let _ = put_transacao(conn, tx_to_api(t));
        }
    }
    if let Some(arr) = data.get("recorrentes").and_then(|v| v.as_array()) {
        for r in arr {
            let _ = put_recorrencia(conn, r.clone());
        }
    }
    if let Some(cfg) = data.get("config") {
        if let Some(cats) = cfg.get("categorias") {
            let _ = set_config(conn, "categorias", &cats.to_string());
        }
        if let Some(contas) = cfg.get("contas") {
            let _ = set_config(conn, "contas", &contas.to_string());
        }
        if let Some(ci) = cfg.get("contasInvestimento") {
            let _ = set_config(conn, "contasInvestimento", &ci.to_string());
        }
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .ok()
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|| "0".to_string());
    let _ = set_config(conn, "lastSyncedAt", &now);
    Ok(())
}
