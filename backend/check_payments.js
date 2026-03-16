const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:2840@localhost:5432/template1',
});

async function checkPayments() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM "Payment" LIMIT 5;');
    console.log('Found', result.rowCount, 'payment records');
    console.log('---');
    
    if (result.rows.length > 0) {
      console.log('Column names:', Object.keys(result.rows[0]));
      console.log('---');
      
      result.rows.forEach((row, i) => {
        console.log(`Row ${i + 1}:`, JSON.stringify(row, null, 2));
      });
    } else {
      console.log('No payment records found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPayments();
