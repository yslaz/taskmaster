use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use actix_web_actors::ws;
use actix::prelude::*;
use serde_json::Value;
use chrono::Utc;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::models::notification::{
    CreateNotification, NotificationResponse, WebSocketMessage
};
use crate::utils::response::ApiError;

// WebSocket connection manager
pub type Connections = Arc<RwLock<HashMap<Uuid, Vec<Addr<NotificationWebSocket>>>>>;

#[derive(Clone)]
pub struct NotificationService {
    pool: PgPool,
    connections: Connections,
    broadcast_tx: broadcast::Sender<(Uuid, NotificationResponse)>,
}

impl NotificationService {
    pub fn new(pool: PgPool) -> Self {
        let (broadcast_tx, _) = broadcast::channel(100);
        
        Self {
            pool,
            connections: Arc::new(RwLock::new(HashMap::new())),
            broadcast_tx,
        }
    }

    #[allow(dead_code)]
    pub async fn create_notification(&self, notification: CreateNotification) -> Result<NotificationResponse, ApiError> {
        let metadata_value = notification.metadata.unwrap_or(Value::Object(serde_json::Map::new()));
        
        let created_notification = sqlx::query(
            r#"
            INSERT INTO notifications (user_id, notification_type, title, message, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, user_id, notification_type, title, message, read_at, created_at, metadata
            "#,
        )
        .bind(notification.user_id)
        .bind(notification.notification_type)
        .bind(notification.title)
        .bind(notification.message)
        .bind(metadata_value)
        .bind(Utc::now())
        .fetch_one(&self.pool)
        .await
        .map_err(|e| ApiError::new("DATABASE_ERROR", &e.to_string()))?;

        let response = NotificationResponse {
            id: created_notification.get("id"),
            notification_type: created_notification.get("notification_type"),
            title: created_notification.get("title"),
            message: created_notification.get("message"),
            read_at: created_notification.get("read_at"),
            created_at: created_notification.get("created_at"),
            metadata: created_notification.get("metadata"),
        };
        
        // Broadcast to connected WebSocket clients
        let _ = self.broadcast_tx.send((notification.user_id, response.clone()));
        
        Ok(response)
    }

    pub async fn get_user_notifications(&self, user_id: Uuid, limit: Option<i64>, offset: Option<i64>) -> Result<Vec<NotificationResponse>, ApiError> {
        let limit = limit.unwrap_or(50);
        let offset = offset.unwrap_or(0);

        let notifications = sqlx::query(
            r#"
            SELECT id, user_id, notification_type, title, message, read_at, created_at, metadata
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| ApiError::new("DATABASE_ERROR", &e.to_string()))?;

        let response_notifications: Vec<NotificationResponse> = notifications.into_iter().map(|row| NotificationResponse {
            id: row.get("id"),
            notification_type: row.get("notification_type"),
            title: row.get("title"),
            message: row.get("message"),
            read_at: row.get("read_at"),
            created_at: row.get("created_at"),
            metadata: row.get("metadata"),
        }).collect();

        Ok(response_notifications)
    }

    pub async fn mark_as_read(&self, notification_ids: Vec<i32>, user_id: Uuid) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            UPDATE notifications
            SET read_at = $1
            WHERE id = ANY($2) AND user_id = $3 AND read_at IS NULL
            "#,
        )
        .bind(Utc::now())
        .bind(&notification_ids)
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::new("DATABASE_ERROR", &e.to_string()))?;

        Ok(())
    }

    pub async fn get_unread_count(&self, user_id: Uuid) -> Result<i64, ApiError> {
        let row = sqlx::query(
            r#"
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = $1 AND read_at IS NULL
            "#,
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| ApiError::new("DATABASE_ERROR", &e.to_string()))?;

        let count: i64 = row.get("count");
        Ok(count)
    }

    pub async fn add_connection(&self, user_id: Uuid, addr: Addr<NotificationWebSocket>) {
        let mut connections = self.connections.write().await;
        connections.entry(user_id).or_insert_with(Vec::new).push(addr);
    }

    pub async fn remove_connection(&self, user_id: Uuid, addr: &Addr<NotificationWebSocket>) {
        let mut connections = self.connections.write().await;
        if let Some(user_connections) = connections.get_mut(&user_id) {
            user_connections.retain(|conn| conn != addr);
            if user_connections.is_empty() {
                connections.remove(&user_id);
            }
        }
    }

    pub fn get_broadcast_receiver(&self) -> broadcast::Receiver<(Uuid, NotificationResponse)> {
        self.broadcast_tx.subscribe()
    }

    // Helper methods for generating notifications from task events
    #[allow(dead_code)]
    pub async fn notify_task_due_soon(&self, user_id: Uuid, task_title: &str, hours_until_due: i32) -> Result<NotificationResponse, ApiError> {
        let notification = CreateNotification {
            user_id,
            notification_type: "task_due_soon".to_string(),
            title: "Task Due Soon".to_string(),
            message: format!("'{}' is due in {} hours", task_title, hours_until_due),
            metadata: Some(serde_json::json!({
                "hours_until_due": hours_until_due
            })),
        };

        self.create_notification(notification).await
    }

    #[allow(dead_code)]
    pub async fn notify_task_assigned(&self, user_id: Uuid, task_title: &str, task_id: i32) -> Result<NotificationResponse, ApiError> {
        let notification = CreateNotification {
            user_id,
            notification_type: "task_assigned".to_string(),
            title: "New Task Assigned".to_string(),
            message: format!("'{}' has been assigned to you", task_title),
            metadata: Some(serde_json::json!({
                "task_id": task_id
            })),
        };

        self.create_notification(notification).await
    }

    #[allow(dead_code)]
    pub async fn notify_task_completed(&self, user_id: Uuid, task_title: &str, task_id: i32) -> Result<NotificationResponse, ApiError> {
        let notification = CreateNotification {
            user_id,
            notification_type: "task_completed".to_string(),
            title: "Task Completed".to_string(),
            message: format!("'{}' has been marked as completed", task_title),
            metadata: Some(serde_json::json!({
                "task_id": task_id
            })),
        };

        self.create_notification(notification).await
    }

    #[allow(dead_code)]
    pub async fn notify_task_overdue(&self, user_id: Uuid, task_title: &str, task_id: i32) -> Result<NotificationResponse, ApiError> {
        let notification = CreateNotification {
            user_id,
            notification_type: "task_overdue".to_string(),
            title: "Task Overdue".to_string(),
            message: format!("'{}' is now overdue", task_title),
            metadata: Some(serde_json::json!({
                "task_id": task_id
            })),
        };

        self.create_notification(notification).await
    }
}

// WebSocket Actor
pub struct NotificationWebSocket {
    user_id: Option<Uuid>,
    notification_service: NotificationService,
    broadcast_rx: Option<broadcast::Receiver<(Uuid, NotificationResponse)>>,
}

impl NotificationWebSocket {
    pub fn new(notification_service: NotificationService) -> Self {
        let broadcast_rx = notification_service.get_broadcast_receiver();
        
        Self {
            user_id: None,
            notification_service,
            broadcast_rx: Some(broadcast_rx),
        }
    }

    fn start_broadcast_listener(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
        if let Some(mut rx) = self.broadcast_rx.take() {
            let user_id = self.user_id;
            
            ctx.spawn(
                async move {
                    while let Ok((target_user_id, notification)) = rx.recv().await {
                        if Some(target_user_id) == user_id {
                            return Some(WebSocketMessage::Notification(notification));
                        }
                    }
                    None
                }
                .into_actor(self)
                .map(|msg, _actor, ctx| {
                    if let Some(message) = msg {
                        let json = serde_json::to_string(&message).unwrap();
                        ctx.text(json);
                    }
                }),
            );
        }
    }
}

impl Actor for NotificationWebSocket {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        tracing::info!("WebSocket connection started");
        self.start_broadcast_listener(ctx);
    }

    fn stopped(&mut self, ctx: &mut Self::Context) {
        if let Some(user_id) = self.user_id {
            let service = self.notification_service.clone();
            let addr = ctx.address();
            
            tokio::spawn(async move {
                service.remove_connection(user_id, &addr).await;
            });
        }
        tracing::info!("WebSocket connection stopped");
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for NotificationWebSocket {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Pong(_)) => {},
            Ok(ws::Message::Text(text)) => {
                // Handle authentication message
                if let Ok(auth_msg) = serde_json::from_str::<serde_json::Value>(&text) {
                    if let Some(user_id_str) = auth_msg.get("user_id").and_then(|v| v.as_str()) {
                        if let Ok(user_id) = Uuid::parse_str(user_id_str) {
                            self.user_id = Some(user_id);
                            let service = self.notification_service.clone();
                            let addr = ctx.address();
                            
                            tokio::spawn(async move {
                                service.add_connection(user_id, addr).await;
                            });
                            
                            ctx.text(r#"{"type":"authenticated","status":"success"}"#);
                        }
                    }
                }
            },
            Ok(ws::Message::Binary(_)) => {
                tracing::warn!("Unexpected binary message");
            },
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            },
            Ok(ws::Message::Continuation(_)) => {
                tracing::warn!("Continuation frames not supported");
            },
            Ok(ws::Message::Nop) => {
                // No operation - do nothing
            },
            Err(e) => {
                tracing::error!("WebSocket error: {}", e);
                ctx.stop();
            }
        }
    }
}
