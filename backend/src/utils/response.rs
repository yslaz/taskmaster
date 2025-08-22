use actix_web::{HttpResponse, ResponseError, http::StatusCode};
use serde::Serialize;
use serde_json::json;
use validator::ValidationErrors;
use std::fmt;

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub success: bool,
    pub error: ErrorDetails,
}

#[derive(Debug, Serialize)]
pub struct ErrorDetails {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fields: Option<serde_json::Value>,
}

impl<T> ApiResponse<T>
where
    T: Serialize,
{
    pub fn success(data: T, message: &str) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: message.to_string(),
        }
    }

}

impl ApiError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            success: false,
            error: ErrorDetails {
                code: code.to_string(),
                message: message.to_string(),
                fields: None,
            },
        }
    }

    pub fn with_fields(code: &str, message: &str, fields: serde_json::Value) -> Self {
        Self {
            success: false,
            error: ErrorDetails {
                code: code.to_string(),
                message: message.to_string(),
                fields: Some(fields),
            },
        }
    }

    pub fn validation_error(errors: ValidationErrors) -> Self {
        Self::with_fields(
            "VALIDATION_ERROR",
            "Validation failed",
            json!(errors),
        )
    }


    pub fn not_found(resource: &str) -> Self {
        Self::new(
            &format!("{}_NOT_FOUND", resource.to_uppercase()),
            &format!("{} not found", resource),
        )
    }

    pub fn unauthorized(message: &str) -> Self {
        Self::new("UNAUTHORIZED", message)
    }

    pub fn conflict(message: &str) -> Self {
        Self::new("CONFLICT", message)
    }

    pub fn internal_error(message: &str) -> Self {
        Self::new("INTERNAL_ERROR", message)
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.error.message)
    }
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        let status = match self.error.code.as_str() {
            "VALIDATION_ERROR" => StatusCode::BAD_REQUEST,
            "UNAUTHORIZED" => StatusCode::UNAUTHORIZED,
            "NOT_FOUND" => StatusCode::NOT_FOUND,
            "CONFLICT" => StatusCode::CONFLICT,
            "DATABASE_ERROR" => StatusCode::INTERNAL_SERVER_ERROR,
            code if code.ends_with("_NOT_FOUND") => StatusCode::NOT_FOUND,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };
        
        HttpResponse::build(status).json(self)
    }
}

// Helper functions for common HTTP responses
pub fn ok_response<T: Serialize>(data: T, message: &str) -> HttpResponse {
    HttpResponse::Ok().json(ApiResponse::success(data, message))
}

pub fn created_response<T: Serialize>(data: T, message: &str) -> HttpResponse {
    HttpResponse::Created().json(ApiResponse::success(data, message))
}


pub fn bad_request_response(error: ApiError) -> HttpResponse {
    HttpResponse::BadRequest().json(error)
}

pub fn unauthorized_response(message: &str) -> HttpResponse {
    HttpResponse::Unauthorized().json(ApiError::unauthorized(message))
}

pub fn not_found_response(resource: &str) -> HttpResponse {
    HttpResponse::NotFound().json(ApiError::not_found(resource))
}

pub fn conflict_response(message: &str) -> HttpResponse {
    HttpResponse::Conflict().json(ApiError::conflict(message))
}

pub fn internal_error_response(message: &str) -> HttpResponse {
    HttpResponse::InternalServerError().json(ApiError::internal_error(message))
}

pub fn validation_error_response(errors: ValidationErrors) -> HttpResponse {
    HttpResponse::BadRequest().json(ApiError::validation_error(errors))
}