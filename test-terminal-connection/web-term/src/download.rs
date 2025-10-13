use serde_json::json;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use tokio::sync::mpsc;
use futures_util::StreamExt;
use object_store::{
    gcp::{GoogleCloudStorageBuilder, GoogleConfigKey},
    ObjectStore, path::Path,
};
use std::sync::Arc;
use std::collections::HashSet;

// Helper function to send progress updates
async fn send_progress_update(
    progress_tx: &mut Option<mpsc::UnboundedSender<String>>,
    message: &str,
) {
    if let Some(tx) = progress_tx {
        let progress_msg = format!("📊 {}", message);
        if let Err(e) = tx.send(progress_msg) {
            eprintln!("Failed to send progress update: {}", e);
        }
    }
}

pub async fn download(
    slug: &str, 
    mut progress_tx: Option<mpsc::UnboundedSender<String>>
) -> Result<PathBuf, Box<dyn std::error::Error + Send + Sync>> {
    println!("🚀 Starting download from GCP bucket for folder: workspaces/{}", slug);
    send_progress_update(&mut progress_tx, &format!("Starting download from workspaces/{} folder...", slug)).await;
    
    let credentials_json = json!({
        "type": "service_account",
        "project_id": "overview-synti",
        "private_key_id": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCZ4GiBbEtfsT/j\nl1mnS2MRbjyDjU7wQGeBvi3TD4jmBcWi8EHzp+H1rIxj9fHWBHA2LhEiETN6Hw6z\n4MnEGSLCk+XsGWIJrzc4oX8RGpEg9XLFAHEszSVavaumS4KMSuYc8MTZYsfRjYHd\nZDlej5i8qFsEn9F+UO/oOo/gQuAV2/uiT19qZTs0biKiJKT5a22O44QzD1tk0Fah\nZyvjv1YLGuwnRVNipLFqzxQQOkcJhj3r2KX+BQ+CAseanMzBf3JL+L9tJnnxZ0kD\nW/BYbmvDx48HAhdUZhAv0t0ZL3+1NzW8emVzRuzcsRRlt2v1f69PscAJUmtiHV9E\nPE3Hn5jFAgMBAAECggEAGtFvpU7YfB8KQYI5T9zlsT4DMfJI1bqDz6rzlZtZgq1y\n2okBFZQm34hpF2rf8Sro26h/t+5DiH8tMtB0mca/tiXMpq9t1L5C443R9YspzBK7\nI/aFwwcmAYCZD+yNHiJXpKeZx0FeDfmZrpovHXntZsP4yP+JpXg5t8GtHarKH0To\nhuTcnqKo7BfSjN/sZMGnvIjyja7eACVJU5FG9nd7vNQekm0ZUxLXylOvzBIAW1Xx\nDba3HHX0YIL+nyleZvC4A4JrXE65iPU3dqQvbwkZNsfCTtaE6AFfKiVcAAXf2icw\nU57e8NoH5fwmQ+5VXofhD7jbG8N2+8vZp+552fD7AQKBgQDNdUg2n7SZR75MNwx2\nXusH1U8xrt9R3cE0QE0vFglG7HzkSICXIvYytrdZWyxA0WTaT+xMxDGO4L7Ohuqk\nk8OiJ1r3RblrmING2eXaMl2cEYsZAlRBnrykSDNAIj0kD9S0lGFve+wmxC5Jw7dr\n5BaqpKRwGwHIJ+oewjEst9gcpQKBgQC/usfgUdsXqj0GO1gqMgL2u2bjsWKQHd53\nIC4lsL5kXwj/nCougXtrRIh2n1Gcq17tGPKPkryT5QLnxUu9ZY+6WkNZSJhcfFS8\nXxStrWH8NgCMpFR1O5hREKCYlebXL2zCRTUZS4943E8Olj4CjxLfStuU8t/W1p+b\nsEGB9zIxoQKBgQC0WmSWlqDZALJaguQssGuOR8Ap88DTQ18K9/sI/0YLfSKw3bgL\nc8Q8hknyZWc2StlGDmx2gq6iJkU4VBR7fb54hCWE9C6s9YcfVb1ASYAEtR2uSW4e\n4DHl3/8lKCkVk9P65FmXnGeTLBkZ5XUIf4MqLjautfZddjQ85eh2wbcyhQKBgEHw\n74WLIZtGBa77AhuhD7vkQELXY1rFqxm1i6mS3CiRNvsSrr9H8Ta3X2fM67jCh+dr\nySDwCsOi5Bjqll4RbBlfqgIvIZfNeyc+XFJPa3/e4tl8O0AGuyBGY7WW+MnRmcpH\nGzgT8MhUnSwbKEChDJCXomXcEnhFYKefOyiD6FOBAoGAfiXxNfmK6iTGqG3A+HHI\n1TupEEPZudygJ2Awd1+22iy5++0BqvMf3o0j0JP0u8ArwkcVDWNuLWrpI6aHZIb8\nVb34haFWR82J/tX2NTq9zAQq//d8OAgEH6PDb0K2YlQVOSmPcYWqd7aGVGMW5+QO\nhZeaOzLwbJLOa36t6Ph+70c=\n-----END PRIVATE KEY-----\n",
        "client_email": "file-uploader-service@overview-synti.iam.gserviceaccount.com",
        "client_id": "123456789012345678901",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/file-uploader-service%40overview-synti.iam.gserviceaccount.com"
    }).to_string();

    // Optional sanity check: ensure valid JSON
    let _value: serde_json::Value = serde_json::from_str(&credentials_json)
        .map_err(|e| format!("Credentials JSON invalid: {}", e))?;

    // -------------------------
    // Build the GCS object store
    // -------------------------
    let bucket_name = "synthi-cloud-storage";

    // Create a temporary file with the service account credentials in the system's temp directory
    let temp_cred_path = std::env::temp_dir().join(format!("temp_credentials_{}.json", std::process::id()));
    fs::write(&temp_cred_path, &credentials_json)?;
    
    // Set multiple environment variables to force use of service account key
    std::env::set_var("GOOGLE_APPLICATION_CREDENTIALS", temp_cred_path.display().to_string());
    std::env::set_var("GOOGLE_CLOUD_PROJECT", "overview-synti");
    
    // Try to disable Application Default Credentials
    std::env::remove_var("GCLOUD_PROJECT");
    std::env::remove_var("CLOUDSDK_CORE_PROJECT");
    
    // Build the GCS object store with explicit service account key
    let mut builder = GoogleCloudStorageBuilder::new();
    builder = builder.with_bucket_name(bucket_name);
    
    // Try multiple approaches to force use of service account key
    builder = builder.with_config(GoogleConfigKey::ServiceAccountKey, &credentials_json);
    
    let store_impl = builder.build()
        .map_err(|e| format!("Failed to build GCS store: {}", e))?;

    let store: Arc<dyn ObjectStore> = Arc::new(store_impl);
    send_progress_update(&mut progress_tx, "Connected to GCS bucket successfully!").await;
    
    // List objects with workspaces/slug prefix
    let prefix = Path::from(format!("workspaces/{}/", slug.trim_matches('/')));
    println!("🔍 Searching for objects with prefix: {}", prefix.as_ref());
    send_progress_update(&mut progress_tx, &format!("Searching in workspaces/{}/ folder...", slug)).await;
    
    let mut list_stream = store.list(Some(&prefix));
    let mut objects: Vec<Path> = Vec::new();
    while let Some(meta_res) = list_stream.next().await {
        let meta = meta_res?;
        let location_str = meta.location.as_ref();
        
        // Skip if doesn't match prefix
        if !location_str.starts_with(prefix.as_ref()) {
            println!("❌ Skipped (doesn't match prefix): {}", location_str);
            continue;
        }
        
        let stripped = location_str.strip_prefix(prefix.as_ref()).unwrap();
        
        // Skip empty paths (top-level directory marker)
        if stripped.is_empty() {
            println!("📁 Skipped top-level directory marker: {}", location_str);
            continue;
        }
        
        // Skip directory markers (paths ending with '/')
        if location_str.ends_with('/') {
            println!("📁 Skipped directory marker: {}", location_str);
            continue;
        }
        
        // Additional check: skip objects with size 0 that look like directories
        if meta.size == 0 && stripped.contains('/') && !stripped.contains('.') {
            println!("📁 Skipped potential directory marker (size 0): {}", location_str);
            continue;
        }
        
        println!("📋 Found object: {} (size: {} bytes)", location_str, meta.size);
        objects.push(meta.location.clone());
        println!("✅ Added to download list: {}", location_str);
    }
    
    if objects.is_empty() {
        println!("⚠️ No objects found under folder: {}/", slug);
        send_progress_update(&mut progress_tx, "No objects found in the specified folder.").await;
        return Ok(());
    }
    
    println!("📂 Found {} objects to download.", objects.len());
    send_progress_update(&mut progress_tx, &format!("Found {} objects to download", objects.len())).await;

    // -------------------------
    // Local directory for downloads - Write to /synthi/
    // -------------------------
    let local_dir = PathBuf::from("/synthi").join(slug);
    
    // Debug: Show current user and permissions
    println!("🔍 Current user: {:?}", std::env::var("USER"));
    println!("🔍 Attempting to create directory: {}", local_dir.display());
    
    // Create the directory structure
    if !local_dir.exists() {
        fs::create_dir_all(&local_dir)
            .map_err(|e| {
                eprintln!("❌ Directory creation failed!");
                eprintln!("   Path: {}", local_dir.display());
                eprintln!("   Error: {}", e);
                eprintln!("   Current working dir: {:?}", std::env::current_dir());
                format!("Failed to create directory {}: {}", local_dir.display(), e)
            })?;
        println!("📁 Created local directory: {}", local_dir.display());
    } else {
        println!("📁 Directory already exists: {}", local_dir.display());
    }
    
    send_progress_update(&mut progress_tx, &format!("Downloading to: {}", local_dir.display())).await;

    // Download each object
    for (index, object_path) in objects.iter().enumerate() {
        let object_name: &str = object_path.as_ref();
        println!("📥 Downloading object: {}", object_name);
        
        // Send animated progress update
        let progress_percent = ((index + 1) as f32 / objects.len() as f32 * 100.0) as u32;
        let progress_bar = "█".repeat((progress_percent / 5) as usize) + &"░".repeat(20 - (progress_percent / 5) as usize);
        send_progress_update(&mut progress_tx, &format!("Downloading {} ({}/{}): [{}] {}%", 
            object_name, index + 1, objects.len(), progress_bar, progress_percent)).await;

        // Construct the local file path (strip workspaces/slug prefix)
        let stripped = object_name.strip_prefix(prefix.as_ref())
            .ok_or_else(|| format!("Failed to strip prefix from: {}", object_name))?;
        
        // Additional safety: remove any leading slashes from stripped path
        let stripped_clean = stripped.trim_start_matches('/');
        
        println!("🔧 Processing: {} -> {}", object_name, stripped_clean);
        let local_path = local_dir.join(stripped_clean);
        let parent_dir = local_path.parent().ok_or("Invalid path")?;
        
        // Create parent directories if they don't exist
        if !parent_dir.exists() {
            fs::create_dir_all(parent_dir)
                .map_err(|e| format!("Failed to create directory {}: {}", parent_dir.display(), e))?;
            println!("📁 Created directory: {}", parent_dir.display());
        }

        // Download the full object into memory then write to disk
        let get_result = store.get(object_path).await
            .map_err(|e| format!("Failed to download {}: {}", object_name, e))?;
        let data = get_result.bytes().await
            .map_err(|e| format!("Failed to read bytes from {}: {}", object_name, e))?;
        
        let mut file = fs::File::create(&local_path)
            .map_err(|e| format!("Failed to create file {}: {}", local_path.display(), e))?;
        file.write_all(&data)
            .map_err(|e| format!("Failed to write to file {}: {}", local_path.display(), e))?;
        
        println!("✅ Saved to: {}", local_path.display());
        send_progress_update(&mut progress_tx, &format!("✅ Downloaded: {}", stripped_clean)).await;
    }
    
    println!("🎉 Download completed! Files saved to: {}", local_dir.display());
    send_progress_update(&mut progress_tx, &format!("🎉 Download completed! Files saved to: {}", local_dir.display())).await;

    // Clean up temporary credentials file
    let _ = fs::remove_file(&temp_cred_path);

    // Return the local directory path so the caller can navigate to it
    Ok(local_dir)
}
