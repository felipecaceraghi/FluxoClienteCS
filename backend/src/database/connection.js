const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseConnection {
    constructor() {
        this.dbPath = path.join(__dirname, 'fluxoclientecs.db');
        this.db = null;
    }

    async connect() {
        if (this.db) {
            return this.db; // Já conectado
        }

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Erro ao conectar no SQLite:', err.message);
                    reject(err);
                } else {
                    resolve(this.db);
                }
            });
        });
    }

    async query(sql, params = []) {
        await this.connect();
        
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async run(sql, params = []) {
        await this.connect();
        
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    async get(sql, params = []) {
        await this.connect();
        
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) {
                        console.error('Erro ao fechar banco:', err.message);
                    }
                    this.db = null;
                    resolve();
                });
            });
        }
    }
}

// Singleton para reutilizar a conexão
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
