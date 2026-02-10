use crate::error::AppError;
use crate::models::{HandleResponse, UpsertHandleRequest};
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::Json;

fn normalize_handle(value: &str) -> String {
    let trimmed = value.trim().to_lowercase();
    if trimmed.starts_with('@') {
        trimmed
    } else {
        format!("@{}", trimmed)
    }
}

pub async fn upsert_handle(
    State(state): State<AppState>,
    Json(payload): Json<UpsertHandleRequest>,
) -> Result<Json<HandleResponse>, AppError> {
    if payload.wallet.trim().is_empty() {
        return Err(AppError::bad_request("wallet is required"));
    }
    let handle = normalize_handle(&payload.handle);
    if handle.len() < 3 {
        return Err(AppError::bad_request("handle is too short"));
    }

    let mut store = state.store.write().await;
    store.handles.insert(handle.clone(), payload.wallet.clone());

    Ok(Json(HandleResponse {
        handle,
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
