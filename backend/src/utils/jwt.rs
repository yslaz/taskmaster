use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::env;
use uuid::Uuid;
use actix_web::Result;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,       // Subject (user email)
    pub user_id: String,   // User ID
    pub exp: i64,          // Expiration time
    pub iat: i64,          // Issued at
}

pub fn create_token(email: &str, user_id: &Uuid) -> Result<String> {
    let jwt_secret = env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set");
    
    let expiration_hours = env::var("JWT_EXPIRATION_HOURS")
        .unwrap_or_else(|_| "24".to_string())
        .parse::<i64>()
        .unwrap_or(24);

    let now = Utc::now();
    let expiration = now + Duration::hours(expiration_hours);

    let claims = Claims {
        sub: email.to_string(),
        user_id: user_id.to_string(),
        exp: expiration.timestamp(),
        iat: now.timestamp(),
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_ref()),
    )
    .map_err(|e| {
        actix_web::error::ErrorInternalServerError(format!("Token creation failed: {}", e))
    })?;

    Ok(token)
}

pub fn verify_token(token: &str) -> Result<Claims> {
    let jwt_secret = env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set");

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_ref()),
        &Validation::new(Algorithm::HS256),
    )
    .map_err(|e| {
        actix_web::error::ErrorUnauthorized(format!("Invalid token: {}", e))
    })?;

    Ok(token_data.claims)
}