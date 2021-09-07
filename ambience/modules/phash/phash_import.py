import json
import sqlite3
conn_import = sqlite3.connect('import_phashes.db')
conn = sqlite3.connect('phashes.db')


def create_table():
    cursor = conn.cursor()
    query = '''
	    CREATE TABLE IF NOT EXISTS phashes(
	    	id INTEGER NOT NULL UNIQUE PRIMARY KEY, 
	    	phash BLOB NOT NULL
	    )
	'''
    cursor.execute(query)
    conn.commit()


def get_all_data():
    cursor = conn_import.cursor()
    query = '''
    SELECT id, phash
    FROM phashes
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el: (el[0], el[1]), all_rows))


create_table()
try:
    with open('./../../import_filename_to_img_id.txt', encoding="utf-8") as json_file:
        filename_to_img_id_map = json.load(json_file)
except:
    print("import_filename_to_img_id.txt not found")
    exit()

phash_data_import = get_all_data()
img_id_phash = []
for phash_data in phash_data_import:
    filename = phash_data[0]
    phash = phash_data[1]
    if filename in filename_to_img_id_map:
        img_id = filename_to_img_id_map[filename]
        img_id_phash.append((img_id, phash))

conn.executemany('''INSERT INTO phashes(id, phash) VALUES (?,?)''', img_id_phash)
conn.commit()
