use crate::routes;
use crate::state::AppState;
use axum::routing::{get, post};
use axum::Router;
use tower_http::trace::TraceLayer;

pub fn build_router(state: AppState) -> Router {
    let api = Router::new()
        .route("/auth/nonce", post(routes::auth::create_nonce))
        .route("/auth/verify", post(routes::auth::verify_auth))
        .route("/pin/enroll", post(routes::pin::enroll_pin))
        .route("/pin/verify", post(routes::pin::verify_pin))
        .route(
            "/sessions",
            post(routes::sessions::create_or_refresh_session),
        )
        .route(
            "/sessions/current",
            get(routes::sessions::get_current_session),
        )
        .route("/handles", post(routes::handles::upsert_handle))
        .route("/handles/:handle", get(routes::handles::resolve_handle))
        .route("/quotes/usdc", get(routes::quotes::get_usdc_quote))
        .route(
            "/payment-intents",
            post(routes::payment_intents::create_payment_intent),
        )
        .route(
            "/payment-intents/:id/execute",
            post(routes::payment_intents::execute_payment_intent),
        )
        .route(
            "/payment-intents/:id",
            get(routes::payment_intents::get_payment_intent),
        );

    Router::new()
        .route("/health", get(routes::health::health))
        .nest("/v1", api)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
