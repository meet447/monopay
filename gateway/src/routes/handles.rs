use crate::error::AppError;
use crate::models::{HandleResponse, UpsertHandleRequest};
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::Json;

const VPA_DOMAIN: &str = "@monopay.app";

fn normalize_handle(value: &str) -> String {
    let mut trimmed = value.trim().to_lowercase();
    if trimmed.starts_with('@') {
        trimmed.remove(0);
    }
    
    if trimmed.ends_with(VPA_DOMAIN) {
        trimmed
    } else {
        format!("{}{}", trimmed, VPA_DOMAIN)
    }
}

fn is_valid_handle_part(part: &str) -> bool {
    part.len() >= 3 && part.len() <= 32 && part.chars().all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_')
}

pub async fn upsert_handle(
    State(state): State<AppState>,
    Json(payload): Json<UpsertHandleRequest>,
) -> Result<Json<HandleResponse>, AppError> {
    if payload.wallet.trim().is_empty() {
        return Err(AppError::bad_request("wallet is required"));
    }
    
    let full_handle = normalize_handle(&payload.handle);
    let handle_part = full_handle.strip_suffix(VPA_DOMAIN).unwrap_or(&full_handle);

    if !is_valid_handle_part(handle_part) {
        return Err(AppError::bad_request("handle must be 3-32 characters (alphanumeric, dots, underscores)"));
    }

    let mut store = state.store.write().await;
    
    // Check if handle is already taken by another wallet
    if let Some(existing_wallet) = store.handles.get(&full_handle) {
        if existing_wallet != &payload.wallet {
            return Err(AppError::bad_request("handle is already taken"));
        }
    }

    store.handles.insert(full_handle.clone(), payload.wallet.clone());

    Ok(Json(HandleResponse {
        handle: full_handle,
        wallet: payload.wallet,
    }))
}

pub async fn resolve_handle(
    State(state): State<AppState>,
    Path(handle): Path<String>,
) -> Result<Json<HandleResponse>, AppError> {
    let normalized = normalize_handle(&handle);

    let store = state.store.read().await;
    let wallet = store
        .handles
        .get(&normalized)
        .ok_or_else(|| AppError::not_found("handle not found"))?
        .clone();

    Ok(Json(HandleResponse {
        handle: normalized,
        wallet,
    }))
}
