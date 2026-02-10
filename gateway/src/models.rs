use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct NonceRequest {
    pub wallet: String,
}

#[derive(Debug, Serialize)]
pub struct NonceResponse {
    #[serde(rename = "expiresAt")]
    pub expires_at: DateTime<Utc>,
    pub nonce: String,
}

#[derive(Debug, Deserialize)]
pub struct VerifyAuthRequest {
    pub wallet: String,
    pub nonce: String,
    pub signature: String,
}

#[derive(Debug, Serialize)]
pub struct VerifyAuthResponse {
    #[serde(rename = "accessToken")]
    pub access_token: String,
    #[serde(rename = "userId")]
    pub user_id: String,
}

#[derive(Debug, Deserialize)]
pub struct EnrollPinRequest {
    pub pin: String,
}

#[derive(Debug, Serialize)]
pub struct EnrollPinResponse {
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct VerifyPinRequest {
    pub pin: String,
}

#[derive(Debug, Serialize)]
pub struct VerifyPinResponse {
    pub verified: bool,
    #[serde(rename = "pinToken")]
    pub pin_token: String,
    #[serde(rename = "expiresAt")]
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSessionRequest {
    pub wallet: String,
    #[serde(rename = "deviceId")]
    pub device_id: String,
    #[serde(rename = "perTxLimitInr")]
    pub per_tx_limit_inr: f64,
    #[serde(rename = "dailyLimitInr")]
    pub daily_limit_inr: f64,
    #[serde(rename = "ttlMinutes")]
    pub ttl_minutes: i64,
}

#[derive(Debug, Serialize)]
pub struct SessionResponse {
    pub id: String,
    pub status: String,
    pub wallet: String,
    #[serde(rename = "perTxLimitInr")]
    pub per_tx_limit_inr: f64,
    #[serde(rename = "dailyLimitInr")]
    pub daily_limit_inr: f64,
    #[serde(rename = "remainingTodayInr")]
    pub remaining_today_inr: f64,
    #[serde(rename = "expiresAt")]
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertHandleRequest {
    pub handle: String,
    pub wallet: String,
}

#[derive(Debug, Serialize)]
pub struct HandleResponse {
    pub handle: String,
    pub wallet: String,
}

#[derive(Debug, Deserialize)]
pub struct QuoteQuery {
    pub inr: f64,
}

#[derive(Debug, Serialize)]
pub struct QuoteResponse {
    pub inr: String,
    pub usdc: String,
    pub rate: String,
    pub source: String,
    #[serde(rename = "asOf")]
    pub as_of: DateTime<Utc>,
    #[serde(rename = "expiresAt")]
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePaymentIntentRequest {
    #[serde(rename = "recipientHandle")]
    pub recipient_handle: String,
    #[serde(rename = "inrAmount")]
    pub inr_amount: f64,
    pub token: String,
    pub memo: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PaymentIntentResponse {
    pub id: String,
    pub wallet: String,
    #[serde(rename = "recipientWallet")]
    pub recipient_wallet: String,
    #[serde(rename = "inrAmount")]
    pub inr_amount: String,
    #[serde(rename = "tokenAmount")]
    pub token_amount: String,
    pub token: String,
    #[serde(rename = "quoteExpiresAt")]
    pub quote_expires_at: DateTime<Utc>,
    pub reference: String,
}

#[derive(Debug, Deserialize)]
pub struct ExecutePaymentIntentRequest {
    #[serde(rename = "pinToken")]
    pub pin_token: String,
    #[serde(rename = "sessionId")]
    pub session_id: String,
}

#[derive(Debug, Serialize)]
pub struct ExecutePaymentIntentResponse {
    pub id: String,
    pub status: String,
    pub mode: String,
    pub signature: String,
    #[serde(rename = "explorerUrl")]
    pub explorer_url: String,
}

#[derive(Debug, Serialize)]
pub struct PaymentIntentStatusResponse {
    pub id: String,
    pub status: String,
    pub mode: String,
    pub signature: Option<String>,
    #[serde(rename = "explorerUrl")]
    pub explorer_url: Option<String>,
}
