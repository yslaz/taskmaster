use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use sqlx::Row; // Importar el trait Row
use std::env;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Cargar variables de entorno
    dotenv().ok();
    
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    println!("🔍 Testing database connection...");
    println!("📍 Server: {}", database_url.split('@').nth(1).unwrap_or("unknown"));
    
    // Intentar conexión con timeout extendido
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .acquire_timeout(Duration::from_secs(10))
        .connect(&database_url)
        .await;
    
    match pool {
        Ok(pool) => {
            println!("✅ Database connection successful!");
            
            // Probar una query simple
            let result = sqlx::query("SELECT version();")
                .fetch_one(&pool)
                .await;
            
            match result {
                Ok(row) => {
                    let version: String = row.get(0);
                    println!("📊 PostgreSQL version: {}", version);
                    println!("🎉 Database is ready!");
                }
                Err(e) => {
                    println!("⚠️  Connection successful but query failed: {}", e);
                }
            }
        }
        Err(e) => {
            println!("❌ Database connection failed: {}", e);
            println!();
            println!("🔍 Troubleshooting checklist:");
            println!("   ❏ Is the database server running?");
            println!("   ❏ Is the DATABASE_URL correct?");
            println!("   ❏ Are the credentials valid?");
            println!("   ❏ Is the network/firewall allowing connections?");
            println!("   ❏ Is the port (5432) accessible?");
            std::process::exit(1);
        }
    }
    
    Ok(())
}
