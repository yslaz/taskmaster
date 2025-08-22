use taskmaster_backend::models::task::{
    Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest, 
    TaskFilters, TasksResponse
};
use chrono::Utc;
use uuid::Uuid;
use validator::Validate;

#[test]
fn test_task_status_serialization() {
    assert_eq!(serde_json::to_string(&TaskStatus::Todo).unwrap(), "\"todo\"");
    assert_eq!(serde_json::to_string(&TaskStatus::Doing).unwrap(), "\"doing\"");
    assert_eq!(serde_json::to_string(&TaskStatus::Done).unwrap(), "\"done\"");
}

#[test]
fn test_task_status_deserialization() {
    assert_eq!(serde_json::from_str::<TaskStatus>("\"todo\"").unwrap(), TaskStatus::Todo);
    assert_eq!(serde_json::from_str::<TaskStatus>("\"doing\"").unwrap(), TaskStatus::Doing);
    assert_eq!(serde_json::from_str::<TaskStatus>("\"done\"").unwrap(), TaskStatus::Done);
}

#[test]
fn test_task_priority_serialization() {
    assert_eq!(serde_json::to_string(&TaskPriority::Low).unwrap(), "\"low\"");
    assert_eq!(serde_json::to_string(&TaskPriority::Med).unwrap(), "\"med\"");
    assert_eq!(serde_json::to_string(&TaskPriority::High).unwrap(), "\"high\"");
}

#[test]
fn test_task_priority_deserialization() {
    assert_eq!(serde_json::from_str::<TaskPriority>("\"low\"").unwrap(), TaskPriority::Low);
    assert_eq!(serde_json::from_str::<TaskPriority>("\"med\"").unwrap(), TaskPriority::Med);
    assert_eq!(serde_json::from_str::<TaskPriority>("\"high\"").unwrap(), TaskPriority::High);
}

#[test]
fn test_create_task_request_validation_valid() {
    let request = CreateTaskRequest {
        title: "Valid Task Title".to_string(),
        description: Some("A valid description".to_string()),
        status: Some(TaskStatus::Todo),
        priority: Some(TaskPriority::Med),
        due_date: Some(Utc::now()),
        tags: Some(vec!["work".to_string(), "urgent".to_string()]),
    };

    assert!(request.validate().is_ok());
}

#[test]
fn test_create_task_request_validation_title_too_short() {
    let request = CreateTaskRequest {
        title: "Hi".to_string(), // Too short
        description: None,
        status: None,
        priority: None,
        due_date: None,
        tags: None,
    };

    assert!(request.validate().is_err());
}

#[test]
fn test_create_task_request_validation_title_too_long() {
    let request = CreateTaskRequest {
        title: "a".repeat(121), // Too long
        description: None,
        status: None,
        priority: None,
        due_date: None,
        tags: None,
    };

    assert!(request.validate().is_err());
}

#[test]
fn test_create_task_request_validation_minimum_valid_title() {
    let request = CreateTaskRequest {
        title: "Hey".to_string(), // Minimum valid length
        description: None,
        status: None,
        priority: None,
        due_date: None,
        tags: None,
    };

    assert!(request.validate().is_ok());
}

#[test]
fn test_create_task_request_validation_maximum_valid_title() {
    let request = CreateTaskRequest {
        title: "a".repeat(120), // Maximum valid length
        description: None,
        status: None,
        priority: None,
        due_date: None,
        tags: None,
    };

    assert!(request.validate().is_ok());
}

#[test]
fn test_update_task_request_validation_valid() {
    let request = UpdateTaskRequest {
        title: Some("Updated Task Title".to_string()),
        description: Some("Updated description".to_string()),
        status: Some(TaskStatus::Doing),
        priority: Some(TaskPriority::High),
        due_date: Some(Utc::now()),
        tags: Some(vec!["updated".to_string()]),
    };

    assert!(request.validate().is_ok());
}

#[test]
fn test_update_task_request_validation_title_too_short() {
    let request = UpdateTaskRequest {
        title: Some("Hi".to_string()), // Too short
        description: None,
        status: None,
        priority: None,
        due_date: None,
        tags: None,
    };

    assert!(request.validate().is_err());
}

#[test]
fn test_update_task_request_validation_title_too_long() {
    let request = UpdateTaskRequest {
        title: Some("a".repeat(121)), // Too long
        description: None,
        status: None,
        priority: None,
        due_date: None,
        tags: None,
    };

    assert!(request.validate().is_err());
}

#[test]
fn test_update_task_request_validation_all_none() {
    let request = UpdateTaskRequest {
        title: None,
        description: None,
        status: None,
        priority: None,
        due_date: None,
        tags: None,
    };

    // Should be valid even with all None values
    assert!(request.validate().is_ok());
}

#[test]
fn test_tasks_response_creation() {
    let task = Task {
        id: Uuid::new_v4(),
        user_id: Uuid::new_v4(),
        title: "Test Task".to_string(),
        description: Some("Test Description".to_string()),
        status: TaskStatus::Todo,
        priority: TaskPriority::Med,
        due_date: Some(Utc::now()),
        tags: serde_json::json!(["test", "unit"]),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let response = TasksResponse {
        tasks: vec![task],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
    };

    assert_eq!(response.tasks.len(), 1);
    assert_eq!(response.total, 1);
    assert_eq!(response.page, 1);
    assert_eq!(response.limit, 10);
    assert_eq!(response.total_pages, 1);
}

#[test]
fn test_task_filters_deserialization() {
    let json = r#"{
        "status": "doing",
        "priority": "high",
        "tag": "urgent",
        "search": "important",
        "page": 2,
        "limit": 20,
        "sort_by": "created_at",
        "sort_order": "desc"
    }"#;

    let filters: TaskFilters = serde_json::from_str(json).unwrap();
    
    assert_eq!(filters.status, Some(TaskStatus::Doing));
    assert_eq!(filters.priority, Some(TaskPriority::High));
    assert_eq!(filters.tag, Some("urgent".to_string()));
    assert_eq!(filters.search, Some("important".to_string()));
    assert_eq!(filters.page, Some(2));
    assert_eq!(filters.limit, Some(20));
    assert_eq!(filters.sort_by, Some("created_at".to_string()));
    assert_eq!(filters.sort_order, Some("desc".to_string()));
}