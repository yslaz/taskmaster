use taskmaster_backend::models::notification::{
    Notification, NotificationResponse, CreateNotification, MarkAsReadRequest, WebSocketMessage
};
use chrono::Utc;
use uuid::Uuid;
use serde_json::json;

#[test]
fn test_notification_response_from_notification() {
    let notification = Notification {
        id: 1,
        user_id: Uuid::new_v4(),
        notification_type: "task_due".to_string(),
        title: "Task Due Soon".to_string(),
        message: "Your task is due in 1 hour".to_string(),
        read_at: None,
        created_at: Utc::now(),
        metadata: json!({"task_id": "123"}),
    };

    let response = NotificationResponse::from(notification.clone());

    assert_eq!(response.id, notification.id);
    assert_eq!(response.notification_type, notification.notification_type);
    assert_eq!(response.title, notification.title);
    assert_eq!(response.message, notification.message);
    assert_eq!(response.read_at, notification.read_at);
    assert_eq!(response.created_at, notification.created_at);
    assert_eq!(response.metadata, notification.metadata);
}

#[test]
fn test_create_notification_structure() {
    let create_notification = CreateNotification {
        user_id: Uuid::new_v4(),
        notification_type: "task_assigned".to_string(),
        title: "New Task Assigned".to_string(),
        message: "You have been assigned a new task".to_string(),
        metadata: Some(json!({"task_id": "456", "priority": "high"})),
    };

    assert_eq!(create_notification.notification_type, "task_assigned");
    assert_eq!(create_notification.title, "New Task Assigned");
    assert_eq!(create_notification.message, "You have been assigned a new task");
    assert!(create_notification.metadata.is_some());
}

#[test]
fn test_create_notification_without_metadata() {
    let create_notification = CreateNotification {
        user_id: Uuid::new_v4(),
        notification_type: "system".to_string(),
        title: "System Notification".to_string(),
        message: "System maintenance scheduled".to_string(),
        metadata: None,
    };

    assert_eq!(create_notification.notification_type, "system");
    assert!(create_notification.metadata.is_none());
}

#[test]
fn test_mark_as_read_request() {
    let request = MarkAsReadRequest {
        notification_ids: vec![1, 2, 3, 4, 5],
    };

    assert_eq!(request.notification_ids.len(), 5);
    assert_eq!(request.notification_ids[0], 1);
    assert_eq!(request.notification_ids[4], 5);
}

#[test]
fn test_websocket_message_notification_serialization() {
    let notification_response = NotificationResponse {
        id: 1,
        notification_type: "task_due".to_string(),
        title: "Task Due".to_string(),
        message: "Your task is due".to_string(),
        read_at: None,
        created_at: Utc::now(),
        metadata: json!({}),
    };

    let ws_message = WebSocketMessage::Notification(notification_response);
    let serialized = serde_json::to_string(&ws_message).unwrap();
    
    assert!(serialized.contains("\"type\":\"notification\""));
    assert!(serialized.contains("\"notification_type\":\"task_due\""));
}

#[test]
fn test_websocket_message_notification_read_serialization() {
    let ws_message = WebSocketMessage::NotificationRead { notification_id: 42 };
    let serialized = serde_json::to_string(&ws_message).unwrap();
    
    assert!(serialized.contains("\"type\":\"notification_read\""));
    assert!(serialized.contains("\"notification_id\":42"));
}

#[test]
fn test_websocket_message_ping_serialization() {
    let ws_message = WebSocketMessage::Ping;
    let serialized = serde_json::to_string(&ws_message).unwrap();
    
    assert_eq!(serialized, "{\"type\":\"ping\"}");
}

#[test]
fn test_websocket_message_pong_serialization() {
    let ws_message = WebSocketMessage::Pong;
    let serialized = serde_json::to_string(&ws_message).unwrap();
    
    assert_eq!(serialized, "{\"type\":\"pong\"}");
}

#[test]
fn test_websocket_message_deserialization() {
    let ping_json = r#"{"type":"ping"}"#;
    let ping_message: WebSocketMessage = serde_json::from_str(ping_json).unwrap();
    
    match ping_message {
        WebSocketMessage::Ping => assert!(true),
        _ => panic!("Expected Ping message"),
    }

    let pong_json = r#"{"type":"pong"}"#;
    let pong_message: WebSocketMessage = serde_json::from_str(pong_json).unwrap();
    
    match pong_message {
        WebSocketMessage::Pong => assert!(true),
        _ => panic!("Expected Pong message"),
    }

    let read_json = r#"{"type":"notification_read","notification_id":123}"#;
    let read_message: WebSocketMessage = serde_json::from_str(read_json).unwrap();
    
    match read_message {
        WebSocketMessage::NotificationRead { notification_id } => {
            assert_eq!(notification_id, 123);
        },
        _ => panic!("Expected NotificationRead message"),
    }
}