use std::collections::HashMap;

#[tauri::command]
async fn http_request(
    url: String,
    method: Option<String>,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
    timeout: Option<u64>,
) -> Result<(u16, String), String> {
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_millis(timeout.unwrap_or(15000)))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let method = method
        .as_deref()
        .unwrap_or("GET")
        .to_uppercase();

    let mut req = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        "HEAD" => client.head(&url),
        _ => return Err(format!("Unsupported HTTP method: {}", method)),
    };

    if let Some(hdrs) = &headers {
        for (key, value) in hdrs {
            req = req.header(key.as_str(), value.as_str());
        }
    }

    if let Some(b) = &body {
        if method != "GET" && method != "HEAD" {
            req = req.body(b.clone());
        }
    }

    let response = req.send().await.map_err(|e| format!("Request failed: {}", e))?;
    let status = response.status().as_u16();
    let response_body = response.text().await.map_err(|e| format!("Failed to read response: {}", e))?;

    Ok((status, response_body))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, http_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
