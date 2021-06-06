import json
import sqlite3
conn_import = sqlite3.connect('import_akaze.db')
conn = sqlite3.connect('akaze.db')

def create_table():
	cursor = conn.cursor()
	query = '''
	    CREATE TABLE IF NOT EXISTS akaze(
	    	id INTEGER NOT NULL UNIQUE PRIMARY KEY, 
	    	akaze_features BLOB NOT NULL
	    )
	'''
	cursor.execute(query)
	conn.commit()

def get_all_data():
    cursor = conn_import.cursor()
    query = '''
    SELECT id, akaze_features
    FROM akaze
    '''
    cursor.execute(query)
    all_rows = cursor.fetchall()
    return list(map(lambda el:(el[0],el[1]),all_rows))


create_table()
with open('./../../import_filename_to_img_id.txt') as json_file:
    filename_to_img_id_map = json.load(json_file)
akaze_data_import=get_all_data()

img_id_akaze=[]
for akaze_data in akaze_data_import:
    filename=akaze_data[0]
    akaze=akaze_data[1]
    if filename in filename_to_img_id_map:
        img_id=filename_to_img_id_map[filename]
        img_id_akaze.append((img_id,akaze))
        
conn.executemany('''INSERT INTO akaze(id, akaze_features) VALUES (?,?)''', img_id_akaze)
conn.commit()
