const express = require('express');
const app = express();
const { Pool } = require('pg');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

// Database connection
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Bored API base URL
const BORED_API_BASE_URL = 'https://www.boredapi.com/api/';

async function getRandomActivity() {
  try {
    const response = await fetch('https://www.boredapi.com/api/activity/');
    const data = await response.json();
    
    if (response.ok) {
      return data.activity; // Assuming data.activity contains the activity
    } else {
      console.error('BoredAPI error:', data);
      return null; // Return null if the API doesn't return a valid response
    }
  } catch (error) {
    console.error('Network error:', error);
    return null; // Handle network errors
  }
}

app.get('/insert_activity', async (req, res) => {
  try {
    const client = await pool.connect();
    const activityName = await getRandomActivity();

    if (activityName) {
      await client.query('INSERT INTO my_activities (activity) VALUES ($1)', [activityName]);
      client.release();
      res.status(200).json({ status: 'success', message: `Activity "${activityName}" inserted successfully` });
    } else {
      res.status(400).json({ status: 'error', message: 'Unable to generate an activity from BoredAPI' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/', async (req, res) => {
  try {
    const client = await pool.connect();

    const countResult = await client.query('SELECT COUNT(*) FROM my_activities');
    const count = countResult.rows[0].count;

    const activitiesResult = await client.query('SELECT activity FROM my_activities');
    const activityNames = activitiesResult.rows.map(row => row.activity);

    client.release();
    res.json({ activity_count: count, activities: activityNames });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
