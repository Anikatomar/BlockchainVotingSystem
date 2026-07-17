import requests

url = "http://127.0.0.1:5000/uploadVoters"

with open("sample_data/voters.csv", "rb") as f:
    files = {
        "file": f
    }

    response = requests.post(url, files=files)

print(response.status_code)
print(response.json())