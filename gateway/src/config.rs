#[derive(Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        let host = std::env::var("MONOPAY_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let port = std::env::var("MONOPAY_PORT")
            .ok()
            .and_then(|v| v.parse::<u16>().ok())
            .unwrap_or(8080);

        Self { host, port }
    }
}
