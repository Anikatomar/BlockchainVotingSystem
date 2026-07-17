import pandas as pd

from database import get_connection


def import_voters(csv_file):

    df = pd.read_csv(csv_file)

    conn = get_connection()
    cursor = conn.cursor()

    imported = 0
    rejected = 0

    reasons = []

    for _, row in df.iterrows():

        try:

            name = str(row["Name"]).strip()
            aadhaar = str(row["Aadhaar"]).strip()
            voter_id = str(row["VoterID"]).strip()
            age = int(row["Age"])
            eligible = str(row["Eligible"]).strip().lower()

            if eligible == "yes":
                eligible = 1
            else:
                eligible = 0

            if age < 18:
                eligible = 0

            cursor.execute("""
                INSERT INTO voters
                (
                    aadhaar,
                    voter_id,
                    name,
                    age,
                    eligible
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    aadhaar,
                    voter_id,
                    name,
                    age,
                    eligible
                ))

            imported += 1

        except Exception as e:

            rejected += 1
            reasons.append(str(e))

    conn.commit()
    conn.close()

    return {

        "imported": imported,

        "rejected": rejected,

        "errors": reasons

    }