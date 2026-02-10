mod app;
mod config;
mod error;
mod models;
mod routes;
mod state;

use anyhow::Context;
use state::{AppState, InMemoryStore};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "solupi_gateway=debug,tower_http=info".into()),
        )
        .init();

    let cfg = config::Config::from_env();
    let state = AppState {
        store: Arc::new(RwLock::new(InMemoryStore::default())),
    };
    let router = app::build_router(state);
    let addr: SocketAddr = format!("{}:{}", cfg.host, cfg.port)
        .parse()
        .context("invalid bind address")?;

    let listener = tokio::net::TcpListener::bind(addr).await?;
    info!("solupi-gateway listening on {}", listener.local_addr()?);
    axum::serve(listener, router).await?;

    Ok(())
}
