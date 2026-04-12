import mysql.connector
import os
import bcrypt

# TiDB Connection — load from environment variables (never hardcode credentials)
# Set these before running:
#   $env:DB_USER="3E7gu7DaxQpjNLL.root"
#   $env:DB_PASSWORD="your-password"
#   $env:DB_HOST="gateway01.ap-northeast-1.prod.aws.tidbcloud.com"
db_config = {
    'user': os.environ['DB_USER'],
    'password': os.environ['DB_PASSWORD'],
    'host': os.environ['DB_HOST'],
    'port': int(os.environ.get('DB_PORT', 4000)),
    'database': os.environ.get('DB_NAME', 'bsc_students'),
    'ssl_disabled': False
}

def seed():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Salt and hash password
        password = "admin"
        salt = bcrypt.gensalt()
        pw_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # Insert admin user
        sql = "INSERT INTO User (email, fullname, password_hash, role, is_active) VALUES (%s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE email=email"
        val = ("teacher@quiz.com", "Admin Teacher", pw_hash, "teacher", 1)
        cursor.execute(sql, val)
        
        conn.commit()
        print("SUCCESS: Admin user seeded!")
        
    except Exception as err:
        print(f"FAILED: {err}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == "__main__":
    seed()
