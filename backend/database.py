import sqlite3

DATABASE = "verified_voters.db"


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def get_all_voters():

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM voters
    """)

    voters = cursor.fetchall()

    conn.close()

    return [dict(voter) for voter in voters]
def verify_voter(identity):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM voters
        WHERE aadhaar=?
        OR voter_id=?
    """, (identity, identity))

    voter = cursor.fetchone()

    conn.close()

    return voter
def mark_voted(identity):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("""

        UPDATE voters

        SET has_voted = 1

        WHERE aadhaar = ?

        OR voter_id = ?

    """, (identity, identity))

    conn.commit()

    conn.close()
def initialize_database():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS voters (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            aadhaar TEXT UNIQUE,

            voter_id TEXT UNIQUE,

            name TEXT,

            age INTEGER,

            eligible INTEGER DEFAULT 1,

            has_voted INTEGER DEFAULT 0

        )
    """)
    conn.commit()
    conn.close()

    print("Verified voter database initialized.")