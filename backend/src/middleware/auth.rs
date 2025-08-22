use actix_web::{web, Error, FromRequest};
use actix_web::error::ErrorUnauthorized;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::User;
use crate::utils::jwt::verify_token;

use actix_web::dev::Payload;
use futures_util::future::LocalBoxFuture;

pub struct AuthenticatedUser(pub User);

impl FromRequest for AuthenticatedUser {
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self, Self::Error>>;

    fn from_request(req: &actix_web::HttpRequest, _: &mut Payload) -> Self::Future {
        let auth_header = req.headers().get("Authorization").cloned();
        let pool = req.app_data::<web::Data<PgPool>>().cloned();

        Box::pin(async move {
            let auth_header = auth_header
                .ok_or_else(|| ErrorUnauthorized("Authorization header missing"))?;

            let auth_str = auth_header
                .to_str()
                .map_err(|_| ErrorUnauthorized("Invalid authorization header format"))?;

            if !auth_str.starts_with("Bearer ") {
                return Err(ErrorUnauthorized("Authorization header must start with Bearer"));
            }

            let token = &auth_str[7..];
            let claims = verify_token(token)?;

            let user_id = Uuid::parse_str(&claims.user_id)
                .map_err(|_| ErrorUnauthorized("Invalid user ID in token"))?;

            let pool = pool
                .ok_or_else(|| ErrorUnauthorized("Database pool not found"))?;

            // Fetch user from database to ensure they still exist
            let user = sqlx::query_as::<_, User>(
                "SELECT * FROM users WHERE id = $1"
            )
            .bind(&user_id)
            .fetch_optional(pool.get_ref())
            .await
            .map_err(|e| ErrorUnauthorized(format!("Database error: {}", e)))?
            .ok_or_else(|| ErrorUnauthorized("User not found"))?;

            Ok(AuthenticatedUser(user))
        })
    }
}