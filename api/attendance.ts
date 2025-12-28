import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getAttendance(req, res);
      case 'POST':
        return await createAttendance(req, res);
      case 'PUT':
        return await updateAttendance(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Attendance API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAttendance(req: VercelRequest, res: VercelResponse) {
  const { staffId, date, startDate, endDate } = req.query;

  let result;

  if (staffId && date) {
    // Get attendance for specific staff on specific date
    result = await sql`
      SELECT a.*, s.first_name, s.last_name, s.department 
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      WHERE a.staff_id = ${staffId as string} 
      AND DATE(a.clock_in) = ${date as string}
      ORDER BY a.clock_in DESC
    `;
  } else if (staffId && startDate && endDate) {
    // Get attendance for specific staff in date range
    result = await sql`
      SELECT a.*, s.first_name, s.last_name, s.department 
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      WHERE a.staff_id = ${staffId as string}
      AND DATE(a.clock_in) BETWEEN ${startDate as string} AND ${endDate as string}
      ORDER BY a.clock_in DESC
    `;
  } else if (startDate && endDate) {
    // Get all attendance in date range
    result = await sql`
      SELECT a.*, s.first_name, s.last_name, s.department 
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      WHERE DATE(a.clock_in) BETWEEN ${startDate as string} AND ${endDate as string}
      ORDER BY a.clock_in DESC
    `;
  } else if (date) {
    // Get all attendance for specific date
    result = await sql`
      SELECT a.*, s.first_name, s.last_name, s.department 
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      WHERE DATE(a.clock_in) = ${date as string}
      ORDER BY a.clock_in DESC
    `;
  } else {
    // Get recent attendance (last 7 days)
    result = await sql`
      SELECT a.*, s.first_name, s.last_name, s.department 
      FROM attendance a
      JOIN staff s ON a.staff_id = s.id
      WHERE a.clock_in >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY a.clock_in DESC
      LIMIT 100
    `;
  }

  return res.json(result.rows);
}

async function createAttendance(req: VercelRequest, res: VercelResponse) {
  const { id, staffId, clockIn, status, notes } = req.body;

  if (!staffId) {
    return res.status(400).json({ error: 'Staff ID required' });
  }

  const attendanceId = id || `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const clockInTime = clockIn || new Date().toISOString();

  await sql`
    INSERT INTO attendance (id, staff_id, clock_in, status, notes)
    VALUES (${attendanceId}, ${staffId}, ${clockInTime}, ${status || 'present'}, ${notes || null})
  `;

  const result = await sql`SELECT * FROM attendance WHERE id = ${attendanceId}`;
  return res.status(201).json(result.rows[0]);
}

async function updateAttendance(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const { clockOut, hoursWorked, status, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Attendance ID required' });
  }

  // If clockOut provided, calculate hours worked
  let calculatedHours = hoursWorked;
  if (clockOut && !hoursWorked) {
    const existing = await sql`SELECT clock_in FROM attendance WHERE id = ${id as string}`;
    if (existing.rows.length > 0) {
      const clockInDate = new Date(existing.rows[0].clock_in);
      const clockOutDate = new Date(clockOut);
      calculatedHours = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60);
      calculatedHours = Math.round(calculatedHours * 100) / 100;
    }
  }

  await sql`
    UPDATE attendance 
    SET 
      clock_out = COALESCE(${clockOut}, clock_out),
      hours_worked = COALESCE(${calculatedHours}, hours_worked),
      status = COALESCE(${status}, status),
      notes = COALESCE(${notes}, notes)
    WHERE id = ${id as string}
  `;

  const result = await sql`SELECT * FROM attendance WHERE id = ${id as string}`;
  return res.json(result.rows[0]);
}
