import os
import psycopg2

DB_URI = os.getenv('DB_URI')

def init_db():
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    
    with open(schema_path, "r") as f:
        schema_sql = f.read()

    conn = psycopg2.connect(DB_URI)
    cur = conn.cursor()
    cur.execute(schema_sql)
    conn.commit()
    cur.close()
    conn.close()
    print("PostgreSQL database successfully initialized using database/schema.sql!")

if __name__ == "__main__":
    init_db()