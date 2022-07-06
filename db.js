const { Client } = require("pg")
require("dotenv").config();

const pool = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    } 
})

pool.connect()

module.exports = pool