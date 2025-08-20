const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'fluxoclientecs.db');
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Erro ao conectar no SQLite:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Conectado ao SQLite com sucesso');
                    resolve();
                }
            });
        });
    }

    async createTables() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Erro ao criar tabelas:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Tabelas criadas com sucesso');
                    resolve();
                }
            });
        });
    }

    async seedData() {
        // Criar usuário admin padrão
        const adminId = uuidv4();
        const adminEmail = 'felipe.caceraghi@gofurthergroup.com.br';
        const adminPassword = 'admin123'; // Mudar em produção
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Inserir usuário admin
        const insertUser = `
            INSERT OR IGNORE INTO users (id, email, password_hash, name, active) 
            VALUES (?, ?, ?, ?, ?)
        `;

        return new Promise((resolve, reject) => {
            this.db.run(insertUser, [adminId, adminEmail, hashedPassword, 'Administrator', 1], (err) => {
                if (err) {
                    console.error('Erro ao criar usuário admin:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Usuário admin criado:', adminEmail);
                    
                    // Inserir alguns emails de exemplo
                    this.seedEmails().then(() => {
                        resolve();
                    }).catch(reject);
                }
            });
        });
    }

    async seedEmails() {
        const emails = [
            // Grupo X
            { email: 'grupo.x1@empresa.com', grupo: 'X' },
            { email: 'grupo.x2@empresa.com', grupo: 'X' },
            { email: 'grupo.x3@empresa.com', grupo: 'X' },
            // Grupo Y
            { email: 'grupo.y1@empresa.com', grupo: 'Y' },
            { email: 'grupo.y2@empresa.com', grupo: 'Y' },
            { email: 'grupo.y3@empresa.com', grupo: 'Y' }
        ];

        const insertEmail = `
            INSERT OR IGNORE INTO emails (id, email, grupo, active) 
            VALUES (?, ?, ?, ?)
        `;

        const promises = emails.map(emailData => {
            return new Promise((resolve, reject) => {
                const emailId = uuidv4();
                this.db.run(insertEmail, [emailId, emailData.email, emailData.grupo, 1], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });

        await Promise.all(promises);
        console.log('✅ Emails de exemplo inseridos');
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Erro ao fechar banco:', err.message);
                    } else {
                        console.log('✅ Conexão SQLite fechada');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    getConnection() {
        return this.db;
    }
}

// Função para inicializar o banco
async function initializeDatabase() {
    const database = new Database();
    
    try {
        await database.init();
        await database.createTables();
        await database.seedData();
        
        console.log('\n🎉 Banco de dados inicializado com sucesso!');
        console.log('📍 Local:', database.dbPath);
        console.log('👤 Admin padrão: felipe.caceraghi@gofurthergroup.com.br / admin123');

        return database;
    } catch (error) {
        console.error('❌ Erro ao inicializar banco:', error);
        throw error;
    }
}

// Se executado diretamente
if (require.main === module) {
    initializeDatabase()
        .then(db => db.close())
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = {
    Database,
    initializeDatabase
};
