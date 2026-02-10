use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AppState {
    pub store: Arc<RwLock<InMemoryStore>>,
}

#[derive(Debug, Default)]
pub struct InMemoryStore {
    pub wallet_nonces: HashMap<String, NonceRecord>,
    pub wallet_users: HashMap<String, String>,
    pub handles: HashMap<String, String>,
    pub pin_profiles: HashMap<String, PinProfileRecord>,
    pub sessions: HashMap<String, SessionRecord>,
    pub payment_intents: HashMap<String, PaymentIntentRecord>,
}

#[derive(Debug, Clone)]
pub struct NonceRecord {
    pub nonce: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct PinProfileRecord {
    pub pin_hash: String,
    pub failed_attempts: u8,
    pub locked_until: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone)]
pub struct SessionRecord {
    pub id: String,
    pub wallet: String,
    pub device_id: String,
    pub per_tx_limit_inr: f64,
    pub daily_limit_inr: f64,
    pub used_today_inr: f64,
    pub expires_at: DateTime<Utc>,
    pub status: String,
}

#[derive(Debug, Clone)]
pub struct PaymentIntentRecord {
    pub id: String,
    pub creator_user_id: String,
    pub recipient_wallet: String,
    pub inr_amount: f64,
    pub token_amount: f64,
    pub token: String,
    pub quote_expires_at: DateTime<Utc>,
    pub status: String,
    pub mode: Option<String>,
    pub signature: Option<String>,
    pub reference: String,
}
