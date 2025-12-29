import json
import os

def merge_etusa_data():
    base_file = r'c:\Users\anisk\Documents\transit\src\data\etusa_raw.json'
    new_file = r'c:\Users\anisk\Documents\transit\src\data\new_batch.json'

    try:
        # Read existing data
        if os.path.exists(base_file):
            with open(base_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = []

        # Read new data
        with open(new_file, 'r', encoding='utf-8') as f:
            new_data = json.load(f)

        # Merge approach: Create a dictionary keyed by 'idLigne' to prevent duplicates
        # Existing data comes first, new data updates/overwrites if same ID found
        merged_map = {item['idLigne']: item for item in data}
        
        for item in new_data:
            merged_map[item['idLigne']] = item
            
        # Convert back to list
        merged_list = list(merged_map.values())

        # Write back to base file
        with open(base_file, 'w', encoding='utf-8') as f:
            json.dump(merged_list, f, indent=4, ensure_ascii=False)
            
        print("Successfully merged data. Total lines:", len(merged_list))

    except Exception as e:
        print(f"Error merging files: {e}")

if __name__ == "__main__":
    merge_etusa_data()
