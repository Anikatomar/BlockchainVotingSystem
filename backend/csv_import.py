import pandas as pd
from database import get_connection


def import_voters(csv_file):

    df = pd.read_csv(csv_file, dtype=str)

    print("\n========== CSV UPLOADED ==========")
    print("File:", csv_file)
    print("Columns:", df.columns.tolist())
    print("Number of rows:", len(df))
    print(df.to_string())
    print("==================================\n")

    conn = get_connection()
    cursor = conn.cursor()

    imported = 0
    rejected = 0
    reasons = []

    for index, row in df.iterrows():

        try:
            # Read according to YOUR CSV headers
            name = str(row["Name"]).strip()
            aadhaar = str(row["Aadhaar"]).strip()
            voter_id = str(row["VoterId"]).strip()
            age_value = str(row["Age"]).strip()
            eligible = str(row["Eligible"]).strip().lower()
            verified_value = str(row["Verified"]).strip()

            # -----------------------------
            # Required fields
            # -----------------------------

            if not name or name.lower() == "nan":
                raise ValueError("Name is missing")

            if not aadhaar or aadhaar.lower() == "nan":
                raise ValueError("Aadhaar is missing")

            if not aadhaar.isdigit() or len(aadhaar) != 12:
                raise ValueError("Invalid Aadhaar")

            if not voter_id or voter_id.lower() == "nan":
                raise ValueError("Voter ID is missing")

            if not age_value or age_value.lower() == "nan":
                raise ValueError("Age is missing")

            # -----------------------------
            # Age validation
            # -----------------------------

            try:
                age = int(float(age_value))
            except ValueError:
                raise ValueError("Invalid age")

            if age < 18:
                raise ValueError("Voter is underage")

            # -----------------------------
            # Eligibility validation
            # -----------------------------

            if eligible not in ["yes", "1", "true"]:
                raise ValueError("Voter is not eligible")

            # -----------------------------
            # Verification validation
            # -----------------------------

            try:
                verified = int(float(verified_value))
            except ValueError:
                raise ValueError("Invalid verification value")

            if verified != 1:
                raise ValueError("Voter is not verified")

            # -----------------------------
            # Insert valid voter
            # -----------------------------

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
        """, (
            aadhaar,
            voter_id,
            name,
            age,
            1
            ))

            imported += 1

        except Exception as e:

            rejected += 1

            reasons.append(
                f"Row {index + 2}: {str(e)}"
            )

    conn.commit()
    conn.close()

    print("\n========== REJECTION REASONS ==========")

    for reason in reasons:
        print(reason)

    print("========================================\n")

    return {
        "imported": imported,
        "rejected": rejected,
        "errors": reasons
    }