import sqlite3lib from 'sqlite3'
import * as path from 'path'

const sqlite3 = sqlite3lib.verbose()

const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite3'))
// const db = new sqlite3.Database(':memory:')
export default db
export async function dbAll(query: string): Promise<any[]> {
	return new Promise((resolve, reject) => {
		db.all(query, (err, rows) => {
			if (err) return reject(err)
			resolve(rows)
		})
	})
}
