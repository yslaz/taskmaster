pub mod auth;
pub mod stats;
pub mod tasks;
pub mod notifications;

use actix_web::{get, HttpResponse, Result};
use crate::utils::response::*;

#[get("/health")]
pub async fn health_check() -> Result<HttpResponse> {
    let health_data = serde_json::json!({
        "status": "ok",
        "version": "1.0.0"
    });
    
    Ok(ok_response(health_data, "TaskMaster API is running"))
}