import db from '.'

async function main() {
	// status: 0 = rejected, 1 = accepted, 2 = pending
	// chain ids are Wormhole-compatible format
	db.run(
		`CREATE TABLE Logs(
    txHash TEXT PRIMARY KEY,
    vaa TEXT DEFAULT NULL,
    status INTEGER DEFAULT 2,
    receiptId TEXT UNIQUE,
    optionalTag TEXT DEFAULT NULL,
    fromChainId INTEGER NOT NULL,
    toChainId INTEGER NOT NULL
  )`,
		() => console.log('Created Logs table'),
	)
}

main()
