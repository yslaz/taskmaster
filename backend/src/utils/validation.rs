use chrono::{DateTime, Utc};

#[allow(dead_code)]
pub fn validate_due_date(due_date: &DateTime<Utc>) -> bool {
    due_date > &Utc::now()
}

#[allow(dead_code)]
pub fn validate_title_length(title: &str) -> bool {
    let len = title.len();
    len >= 3 && len <= 120
}

#[allow(dead_code)]
pub fn validate_tags(tags: &[String]) -> bool {
    tags.len() <= 10 && tags.iter().all(|tag| !tag.is_empty() && tag.len() <= 50)
}