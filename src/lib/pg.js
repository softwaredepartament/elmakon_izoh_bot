const pg = require('pg')

const pool = new pg.Pool({
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    user: process.env.PG_USER,
    port: process.env.PG_PORT,
    host: process.env.PG_HOST,
})

const uniqRow = async (query, ...arr) => {
    try {
        const client = await pool.connect()
        const data = await client.query(query, arr)
        client.release()
        return data
    } catch (error) {
        console.log(error, 'UNIQROW', query);
    }
}

module.exports = {
    uniqRow
}