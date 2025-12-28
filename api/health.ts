import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDatabase, sql } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST' && req.query.action === 'init') {
      // Initialize database tables
      await initDatabase();
      return res.json({ success: true, message: 'Database initialized successfully' });
    }

    if (req.method === 'GET') {
      // Health check - test database connection
      const result = await sql`SELECT NOW() as current_time, current_database() as database`;
      
      // Get table counts
      const staffCount = await sql`SELECT COUNT(*) as count FROM staff`;
      const attendanceCount = await sql`SELECT COUNT(*) as count FROM attendance`;
      const payrollCount = await sql`SELECT COUNT(*) as count FROM payroll`;

      return res.json({
        status: 'healthy',
        database: result.rows[0].database,
        serverTime: result.rows[0].current_time,
        tables: {
          staff: parseInt(staffCount.rows[0].count),
          attendance: parseInt(attendanceCount.rows[0].count),
          payroll: parseInt(payrollCount.rows[0].count)
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Health check error:', error);
    
    // If tables don't exist, try to initialize
    if (error.message?.includes('does not exist')) {
      try {
        await initDatabase();
        return res.json({ 
          status: 'initialized', 
          message: 'Database tables created successfully' 
        });
      } catch (initError) {
        return res.status(500).json({ 
          status: 'error', 
          error: 'Failed to initialize database' 
        });
      }
    }

    return res.status(500).json({ 
      status: 'error', 
      error: error.message || 'Database connection failed' 
    });
  }
}
