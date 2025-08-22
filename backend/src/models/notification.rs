use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: i32,
    pub user_id: Uuid,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub read_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub metadata: Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNotification {
    pub user_id: Uuid,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub metadata: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationResponse {
    pub id: i32,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub read_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub metadata: Value,
}

impl From<Notification> for NotificationResponse {
    fn from(notification: Notification) -> Self {
        Self {
            id: notification.id,
            notification_type: notification.notification_type,
            title: notification.title,
            message: notification.message,
            read_at: notification.read_at,
            created_at: notification.created_at,
            metadata: notification.metadata,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MarkAsReadRequest {
    pub notification_ids: Vec<i32>,
}

// WebSocket message types
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WebSocketMessage {
    #[serde(rename = "notification")]
    Notification(NotificationResponse),
    #[serde(rename = "notification_read")]
    NotificationRead { notification_id: i32 },
    #[serde(rename = "ping")]
    Ping,
    #[serde(rename = "pong")]
    Pong,
}
