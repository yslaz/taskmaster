use actix_web::{web, HttpRequest, HttpResponse, Result as ActixResult, get, post};
use actix_web_actors::ws;
use serde::Deserialize;

use crate::models::notification::MarkAsReadRequest;
use crate::services::notification_service::{NotificationService, NotificationWebSocket};
use crate::middleware::auth::AuthenticatedUser;
use crate::utils::response::{ApiResponse, ApiError};

#[derive(Deserialize)]
pub struct NotificationQuery {
    limit: Option<i64>,
    offset: Option<i64>,
}

// Get user notifications
#[get("")]
pub async fn get_notifications(
    user: AuthenticatedUser,
    query: web::Query<NotificationQuery>,
    notification_service: web::Data<NotificationService>,
) -> ActixResult<HttpResponse, ApiError> {
    let notifications = notification_service
        .get_user_notifications(user.0.id, query.limit, query.offset)
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(notifications, "Notifications retrieved successfully")))
}

// Get unread notification count
#[get("/unread-count")]
pub async fn get_unread_count(
    user: AuthenticatedUser,
    notification_service: web::Data<NotificationService>,
) -> ActixResult<HttpResponse, ApiError> {
    let count = notification_service.get_unread_count(user.0.id).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
        "unread_count": count
    }), "Unread count retrieved successfully")))
}

// Mark notifications as read
#[post("/mark-read")]
pub async fn mark_as_read(
    user: AuthenticatedUser,
    body: web::Json<MarkAsReadRequest>,
    notification_service: web::Data<NotificationService>,
) -> ActixResult<HttpResponse, ApiError> {
    notification_service
        .mark_as_read(body.notification_ids.clone(), user.0.id)
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
        "message": "Notifications marked as read"
    }), "Notifications marked as read successfully")))
}

// WebSocket endpoint
pub async fn websocket(
    req: HttpRequest,
    stream: web::Payload,
    notification_service: web::Data<NotificationService>,
) -> ActixResult<HttpResponse> {
    let ws_actor = NotificationWebSocket::new(notification_service.get_ref().clone());
    
    ws::start(ws_actor, &req, stream)
}
