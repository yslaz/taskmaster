use chrono::{Utc, Duration};

#[test]
fn test_validate_due_date() {
    use taskmaster_backend::utils::validation::validate_due_date;

    let future = Utc::now() + Duration::hours(1);
    let past = Utc::now() - Duration::hours(1);

    assert!(validate_due_date(&future));
    assert!(!validate_due_date(&past));
}

#[test]
fn test_validate_title_length() {
    use taskmaster_backend::utils::validation::validate_title_length;

    assert!(!validate_title_length(""));
    assert!(!validate_title_length("Hi")); // too short (<3)
    assert!(validate_title_length("Hey"));

    let long = "a".repeat(120);
    assert!(validate_title_length(&long));
    let too_long = "a".repeat(121);
    assert!(!validate_title_length(&too_long));
}

#[test]
fn test_validate_tags() {
    use taskmaster_backend::utils::validation::validate_tags;

    let ok = vec!["work".to_string(), "urgent".to_string()];
    assert!(validate_tags(&ok));

    let empty = vec!["".to_string()];
    assert!(!validate_tags(&empty));

    let too_long = vec!["a".repeat(51)];
    assert!(!validate_tags(&too_long));

    let many: Vec<String> = (0..11).map(|i| format!("t{}", i)).collect();
    assert!(!validate_tags(&many));
}
