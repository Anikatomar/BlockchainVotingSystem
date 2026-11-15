
import sqlite3

DATABASE = "verified_voters.db"


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# Fetch all registered voters
def get_all_voters():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM voters")
    voters = cursor.fetchall()

    conn.close()
    return [dict(voter) for voter in voters]


# Verify a voter using Aadhaar or voter ID
def verify_voter(identity):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM voters
        WHERE aadhaar = ?
        OR voter_id = ?
    """, (identity, identity))

    voter = cursor.fetchone()
    conn.close()

    return voter


# Legacy function: do not use this for election-specific voting
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


# Check whether a voter has voted in a particular election
def has_voted_in_election(election_id, voter_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT has_voted
        FROM voter_elections
        WHERE election_id = ?
        AND voter_id = ?
    """, (election_id, voter_id))

    record = cursor.fetchone()
    conn.close()

    if record is None:
        return False

    return bool(record["has_voted"])


# Mark a voter as having voted in a particular election
def mark_voted_in_election(election_id, voter_id):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("BEGIN IMMEDIATE")

        # Create the voter-election record if it does not exist
        cursor.execute("""
            INSERT OR IGNORE INTO voter_elections
            (election_id, voter_id, has_voted)
            VALUES (?, ?, 0)
        """, (election_id, voter_id))

        # Only allow the status to change from 0 to 1
        cursor.execute("""
            UPDATE voter_elections
            SET has_voted = 1
            WHERE election_id = ?
            AND voter_id = ?
            AND has_voted = 0
        """, (election_id, voter_id))

        updated = cursor.rowcount

        conn.commit()

        return updated == 1

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# Initialize the database and required tables
def initialize_database():
    conn = get_connection()
    cursor = conn.cursor()

    # Existing voter table
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

    # New election-specific voting table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS voter_elections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            election_id INTEGER NOT NULL,
            voter_id INTEGER NOT NULL,
            has_voted INTEGER DEFAULT 0,
            UNIQUE(election_id, voter_id)
        )
    """)

    conn.commit()
    conn.close()

    print("Verified voter database initialized.")
