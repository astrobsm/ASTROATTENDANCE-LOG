import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getStaff(req, res);
      case 'POST':
        return await createStaff(req, res);
      case 'PUT':
        return await updateStaff(req, res);
      case 'DELETE':
        return await deleteStaff(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Staff API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getStaff(req: VercelRequest, res: VercelResponse) {
  const { id, active } = req.query;

  if (id) {
    const result = await sql`SELECT * FROM staff WHERE id = ${id as string}`;
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    return res.json(result.rows[0]);
  }

  let result;
  if (active === 'true') {
    result = await sql`SELECT * FROM staff WHERE is_active = true ORDER BY created_at DESC`;
  } else {
    result = await sql`SELECT * FROM staff ORDER BY created_at DESC`;
  }

  return res.json(result.rows);
}

async function createStaff(req: VercelRequest, res: VercelResponse) {
  const { id, firstName, lastName, department, role, hourlyRate, fingerprintTemplateId } = req.body;

  // Generate ID if not provided
  let staffId = id;
  if (!staffId) {
    const counterResult = await sql`
      UPDATE system_config 
      SET value = (CAST(value AS INTEGER) + 1)::TEXT, updated_at = CURRENT_TIMESTAMP
      WHERE key = 'staff_counter'
      RETURNING value
    `;
    const counter = counterResult.rows[0].value;
    staffId = `ASTRO-EMP-${counter.padStart(4, '0')}`;
  }

  await sql`
    INSERT INTO staff (id, first_name, last_name, department, role, hourly_rate, fingerprint_template_id)
    VALUES (${staffId}, ${firstName}, ${lastName}, ${department}, ${role}, ${hourlyRate || 150}, ${fingerprintTemplateId})
  `;

  const result = await sql`SELECT * FROM staff WHERE id = ${staffId}`;
  return res.status(201).json(result.rows[0]);
}

async function updateStaff(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const { firstName, lastName, department, role, hourlyRate, isActive } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Staff ID required' });
  }

  await sql`
    UPDATE staff 
    SET 
      first_name = COALESCE(${firstName}, first_name),
      last_name = COALESCE(${lastName}, last_name),
      department = COALESCE(${department}, department),
      role = COALESCE(${role}, role),
      hourly_rate = COALESCE(${hourlyRate}, hourly_rate),
      is_active = COALESCE(${isActive}, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id as string}
  `;

  const result = await sql`SELECT * FROM staff WHERE id = ${id as string}`;
  return res.json(result.rows[0]);
}

async function deleteStaff(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Staff ID required' });
  }

  // Soft delete - just deactivate
  await sql`UPDATE staff SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${id as string}`;

  return res.json({ success: true, message: 'Staff deactivated' });
}
