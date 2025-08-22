use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "task_status", rename_all = "lowercase")]
pub enum TaskStatus {
    #[serde(rename = "todo")]
    Todo,
    #[serde(rename = "doing")]
    Doing,
    #[serde(rename = "done")]
    Done,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "task_priority", rename_all = "lowercase")]
pub enum TaskPriority {
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "med")]
    Med,
    #[serde(rename = "high")]
    High,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Task {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub due_date: Option<DateTime<Utc>>,
    pub tags: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateTaskRequest {
    #[validate(length(min = 3, max = 120, message = "Title must be between 3 and 120 characters"))]
    pub title: String,
    
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub priority: Option<TaskPriority>,
    pub due_date: Option<DateTime<Utc>>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateTaskRequest {
    #[validate(length(min = 3, max = 120, message = "Title must be between 3 and 120 characters"))]
    pub title: Option<String>,
    
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub priority: Option<TaskPriority>,
    pub due_date: Option<DateTime<Utc>>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct TaskFilters {
    pub status: Option<TaskStatus>,
    pub priority: Option<TaskPriority>,
    pub tag: Option<String>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub created_from: Option<DateTime<Utc>>,
    pub created_to: Option<DateTime<Utc>>,
    pub due_from: Option<DateTime<Utc>>,
    pub due_to: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct TasksResponse {
    pub tasks: Vec<Task>,
    pub total: i64,
    pub page: u32,
    pub limit: u32,
    pub total_pages: u32,
}