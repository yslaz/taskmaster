use actix_web::{web, post, get, HttpResponse, Result};
use serde_json::json;
use sqlx::PgPool;
use validator::Validate;
use bcrypt::{hash, verify, DEFAULT_COST};
use uuid::Uuid;

use crate::models::{User, CreateUserRequest, LoginRequest, UserResponse};
use crate::utils::jwt::create_token;
use crate::utils::response::*;
use crate::middleware::auth::AuthenticatedUser;

#[post("/register")]
pub async fn register(
    pool: web::Data<PgPool>,
    user_data: web::Json<CreateUserRequest>,
) -> Result<HttpResponse> {
    if let Err(errors) = user_data.validate() {
        return Ok(validation_error_response(errors));
    }

    let user_data = user_data.into_inner();

    let existing_user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&user_data.email)
    .fetch_optional(pool.get_ref())
    .await;

    match existing_user {
        Ok(Some(_)) => {
            return Ok(conflict_response("Email already exists"));
        }
        Err(e) => {
            return Ok(internal_error_response(&e.to_string()));
        }
        _ => {}
    }

    let password_hash = match hash(&user_data.password, DEFAULT_COST) {
        Ok(hash) => hash,
        Err(_) => {
            return Ok(internal_error_response("Failed to hash password"));
        }
    };

    let user_id = Uuid::new_v4();
    let result = sqlx::query(
        "INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)"
    )
    .bind(&user_id)
    .bind(&user_data.name)
    .bind(&user_data.email)
    .bind(&password_hash)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => {
            let user = sqlx::query_as::<_, User>(
                "SELECT * FROM users WHERE id = $1"
            )
            .bind(&user_id)
            .fetch_one(pool.get_ref())
            .await
            .unwrap();

            let token = create_token(&user.email, &user.id)?;
            let user_response = UserResponse::from(user);

            let response_data = json!({
                "user": user_response,
                "token": token
            });

            Ok(created_response(response_data, "User registered successfully"))
        }
        Err(e) => {
            Ok(internal_error_response(&format!("Failed to create user: {}", e)))
        }
    }
}

#[post("/login")]
pub async fn login(
    pool: web::Data<PgPool>,
    login_data: web::Json<LoginRequest>,
) -> Result<HttpResponse> {
    if let Err(errors) = login_data.validate() {
        return Ok(validation_error_response(errors));
    }

    let login_data = login_data.into_inner();

    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&login_data.email)
    .fetch_optional(pool.get_ref())
    .await;

    let user = match user {
        Ok(Some(user)) => user,
        Ok(None) => {
            return Ok(unauthorized_response("Invalid email or password"));
        }
        Err(e) => {
            return Ok(internal_error_response(&e.to_string()));
        }
    };

    let is_valid = match verify(&login_data.password, &user.password_hash) {
        Ok(valid) => valid,
        Err(_) => false,
    };

    if !is_valid {
        return Ok(unauthorized_response("Invalid email or password"));
    }

    let token = create_token(&user.email, &user.id)?;
    let user_response = UserResponse::from(user);

    let response_data = json!({
        "user": user_response,
        "token": token
    });

    Ok(ok_response(response_data, "Login successful"))
}

#[get("/me")]
pub async fn me(user: AuthenticatedUser) -> Result<HttpResponse> {
    let user_response = UserResponse::from(user.0);
    Ok(ok_response(user_response, "User information retrieved successfully"))
}