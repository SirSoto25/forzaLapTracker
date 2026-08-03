//! On-demand car image cache under `{appData}/images/cars/{id}.*`.

use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

const EXTS: &[&str] = &["webp", "jpg", "jpeg", "png", "gif"];

fn cars_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {e}"))?;
    Ok(base.join("images").join("cars"))
}

fn find_cached(dir: &Path, car_id: i64) -> Option<PathBuf> {
    for ext in EXTS {
        let candidate = dir.join(format!("{car_id}.{ext}"));
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

fn pick_extension(url: &str, content_type: Option<&str>) -> &'static str {
    if let Some(ct) = content_type {
        let ct = ct.to_ascii_lowercase();
        if ct.contains("image/png") {
            return "png";
        }
        if ct.contains("image/jpeg") || ct.contains("image/jpg") {
            return "jpg";
        }
        if ct.contains("image/webp") {
            return "webp";
        }
        if ct.contains("image/gif") {
            return "gif";
        }
    }
    let path = url.split('?').next().unwrap_or(url).to_ascii_lowercase();
    if path.ends_with(".png") {
        return "png";
    }
    if path.ends_with(".jpg") || path.ends_with(".jpeg") {
        return "jpg";
    }
    if path.ends_with(".gif") {
        return "gif";
    }
    if path.ends_with(".webp") {
        return "webp";
    }
    "webp"
}

async fn ensure_car_image_inner(
    app: AppHandle,
    car_id: i64,
    image_url: Option<String>,
) -> Result<String, String> {
    let dir = cars_dir(&app)?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("mkdir: {e}"))?;

    if let Some(existing) = find_cached(&dir, car_id) {
        return Ok(existing.to_string_lossy().into_owned());
    }

    let url = image_url
        .map(|u| u.trim().to_string())
        .filter(|u| !u.is_empty())
        .ok_or_else(|| "no image_url".to_string())?;

    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("request: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status()));
    }

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("body: {e}"))?;
    if bytes.is_empty() {
        return Err("empty body".into());
    }

    let ext = pick_extension(&url, content_type.as_deref());
    let dest = dir.join(format!("{car_id}.{ext}"));
    std::fs::write(&dest, &bytes).map_err(|e| format!("write: {e}"))?;
    Ok(dest.to_string_lossy().into_owned())
}

/// Cache car image under app data. Returns absolute path, or `None` on any failure.
///
/// `image_url` comes from the frontend (SQLite row); never throws to the UI.
#[tauri::command]
pub async fn ensure_car_image(
    app: AppHandle,
    car_id: i64,
    image_url: Option<String>,
) -> Option<String> {
    match ensure_car_image_inner(app, car_id, image_url).await {
        Ok(path) => Some(path),
        Err(err) => {
            eprintln!("ensure_car_image({car_id}) failed: {err}");
            None
        }
    }
}
