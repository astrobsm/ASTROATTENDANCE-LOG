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
        return await getPayroll(req, res);
      case 'POST':
        return await createPayroll(req, res);
      case 'PUT':
        return await updatePayroll(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payroll API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPayroll(req: VercelRequest, res: VercelResponse) {
  const { id, staffId, periodStart, periodEnd, status } = req.query;

  let result;

  if (id) {
    result = await sql`
      SELECT p.*, s.first_name, s.last_name, s.department 
      FROM payroll p
      JOIN staff s ON p.staff_id = s.id
      WHERE p.id = ${id as string}
    `;
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll not found' });
    }
    return res.json(result.rows[0]);
  }

  if (staffId) {
    result = await sql`
      SELECT p.*, s.first_name, s.last_name, s.department 
      FROM payroll p
      JOIN staff s ON p.staff_id = s.id
      WHERE p.staff_id = ${staffId as string}
      ORDER BY p.period_end DESC
    `;
  } else if (periodStart && periodEnd) {
    result = await sql`
      SELECT p.*, s.first_name, s.last_name, s.department 
      FROM payroll p
      JOIN staff s ON p.staff_id = s.id
      WHERE p.period_start >= ${periodStart as string} AND p.period_end <= ${periodEnd as string}
      ORDER BY p.period_end DESC
    `;
  } else if (status) {
    result = await sql`
      SELECT p.*, s.first_name, s.last_name, s.department 
      FROM payroll p
      JOIN staff s ON p.staff_id = s.id
      WHERE p.status = ${status as string}
      ORDER BY p.period_end DESC
    `;
  } else {
    result = await sql`
      SELECT p.*, s.first_name, s.last_name, s.department 
      FROM payroll p
      JOIN staff s ON p.staff_id = s.id
      ORDER BY p.generated_at DESC
      LIMIT 100
    `;
  }

  return res.json(result.rows);
}

async function createPayroll(req: VercelRequest, res: VercelResponse) {
  const { staffId, periodStart, periodEnd, totalHours, hourlyRate, grossPay, deductions, netPay } = req.body;

  if (!staffId || !periodStart || !periodEnd) {
    return res.status(400).json({ error: 'Staff ID, period start, and period end are required' });
  }

  const payrollId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const calcGrossPay = grossPay || (totalHours * hourlyRate);
  const calcNetPay = netPay || (calcGrossPay - (deductions || 0));

  await sql`
    INSERT INTO payroll (id, staff_id, period_start, period_end, total_hours, hourly_rate, gross_pay, deductions, net_pay)
    VALUES (${payrollId}, ${staffId}, ${periodStart}, ${periodEnd}, ${totalHours}, ${hourlyRate}, ${calcGrossPay}, ${deductions || 0}, ${calcNetPay})
  `;

  const result = await sql`SELECT * FROM payroll WHERE id = ${payrollId}`;
  return res.status(201).json(result.rows[0]);
}

async function updatePayroll(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const { status, paidAt } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Payroll ID required' });
  }

  if (status === 'paid') {
    await sql`
      UPDATE payroll 
      SET status = 'paid', paid_at = ${paidAt || new Date().toISOString()}
      WHERE id = ${id as string}
    `;
  } else {
    await sql`
      UPDATE payroll 
      SET status = ${status}
      WHERE id = ${id as string}
    `;
  }

  const result = await sql`SELECT * FROM payroll WHERE id = ${id as string}`;
  return res.json(result.rows[0]);
}
