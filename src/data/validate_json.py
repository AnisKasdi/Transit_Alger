import json
import sys

try:
    with open(r'c:\Users\anisk\Documents\transit\src\data\alger_stops.json', 'r', encoding='utf-8') as f:
        json.load(f)
    print("JSON is valid.")
except Exception as e:
    print(f"JSON Invalid: {e}")
    sys.exit(1)
