import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initDatabase() {
  try {
    // Create staff table
    await sql`
      CREATE TABLE IF NOT EXISTS staff (
        id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        role VARCHAR(100) NOT NULL,
        hourly_rate DECIMAL(10,2) DEFAULT 150.00,
        fingerprint_template_id VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create attendance table
    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(50) PRIMARY KEY,
        staff_id VARCHAR(50) NOT NULL REFERENCES staff(id),
        clock_in TIMESTAMP NOT NULL,
        clock_out TIMESTAMP,
        hours_worked DECIMAL(5,2),
        status VARCHAR(20) DEFAULT 'present',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create payroll table
    await sql`
      CREATE TABLE IF NOT EXISTS payroll (
        id VARCHAR(50) PRIMARY KEY,
        staff_id VARCHAR(50) NOT NULL REFERENCES staff(id),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_hours DECIMAL(6,2) NOT NULL,
        hourly_rate DECIMAL(10,2) NOT NULL,
        gross_pay DECIMAL(12,2) NOT NULL,
        deductions DECIMAL(12,2) DEFAULT 0,
        net_pay DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP
      )
    `;

    // Create system_config table
    await sql`
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Initialize staff counter if not exists
    await sql`
      INSERT INTO system_config (key, value)
      VALUES ('staff_counter', '0')
      ON CONFLICT (key) DO NOTHING
    `;

    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export { sql };
