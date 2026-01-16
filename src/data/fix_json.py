import json

file_path = r'c:\Users\anisk\Documents\transit\public\alger_stops.json'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the first closing bracket of the main array
    # This is a naive heuristic but works if the file is [] appended with []
    # We look for the pattern "]\n\n\n\n[" or similar usually
    
    # Better approach: decode raw JSON
    decoder = json.JSONDecoder()
    obj, idx = decoder.raw_decode(content)
    
    print(f"Successfully decoded JSON object of type {type(obj)} with length {len(obj)}")
    
    # Check if there is extra data
    if idx < len(content):
        print(f"Found extra data starting at index {idx}. Truncating...")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(obj, f, indent=2, ensure_ascii=False)
        print("File fixed and saved.")
    else:
        print("File was already valid (no extra data).")

except Exception as e:
    print(f"Error processing file: {e}")
