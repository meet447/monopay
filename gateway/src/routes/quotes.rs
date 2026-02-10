use crate::error::AppError;
use crate::models::{QuoteQuery, QuoteResponse};
use axum::extract::Query;
use axum::Json;
use chrono::{Duration, Utc};

const INR_PER_USDC: f64 = 83.61;

pub async fn get_usdc_quote(
    Query(query): Query<QuoteQuery>,
) -> Result<Json<QuoteResponse>, AppError> {
    if query.inr <= 0.0 {
        return Err(AppError::bad_request("inr must be positive"));
    }

    let now = Utc::now();
    let usdc = query.inr / INR_PER_USDC;
    let expires_at = now + Duration::seconds(30);

    Ok(Json(QuoteResponse {
        inr: format!("{:.2}", query.inr),
        usdc: format!("{:.6}", usdc),
        rate: format!("{:.2}", INR_PER_USDC),
        source: "demo_oracle".to_string(),
        as_of: now,
        expires_at,
    }))
}
