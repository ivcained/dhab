import { sql } from "@vercel/postgres";

export interface UserSobrietyData {
  fid: number;
  startDate: string;
  startTime: string;
  addiction: string;
  customAddiction?: string;
  dailyCost: number;
  motivation?: string;
  pledgeDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Initialize the database table if it doesn't exist
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_sobriety (
        fid INTEGER PRIMARY KEY,
        start_date VARCHAR(10) NOT NULL,
        start_time VARCHAR(5),
        addiction VARCHAR(255) NOT NULL,
        custom_addiction VARCHAR(255),
        daily_cost DECIMAL(10, 2) DEFAULT 8.00,
        motivation TEXT,
        pledge_date VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    return { success: true };
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return { success: false, error };
  }
}

// Get user sobriety data by FID
export async function getUserSobrietyData(
  fid: number
): Promise<UserSobrietyData | null> {
  try {
    const result = await sql`
      SELECT 
        fid,
        start_date as "startDate",
        start_time as "startTime",
        addiction,
        custom_addiction as "customAddiction",
        daily_cost as "dailyCost",
        motivation,
        pledge_date as "pledgeDate",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_sobriety 
      WHERE fid = ${fid}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as UserSobrietyData;
  } catch (error) {
    console.error("Failed to get user sobriety data:", error);
    return null;
  }
}

// Save or update user sobriety data
export async function saveUserSobrietyData(
  data: UserSobrietyData
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await sql`
      INSERT INTO user_sobriety (
        fid, start_date, start_time, addiction, custom_addiction, 
        daily_cost, motivation, pledge_date, updated_at
      ) VALUES (
        ${data.fid}, 
        ${data.startDate}, 
        ${data.startTime || null}, 
        ${data.addiction}, 
        ${data.customAddiction || null},
        ${data.dailyCost || 8},
        ${data.motivation || null},
        ${data.pledgeDate || null},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (fid) 
      DO UPDATE SET
        start_date = ${data.startDate},
        start_time = ${data.startTime || null},
        addiction = ${data.addiction},
        custom_addiction = ${data.customAddiction || null},
        daily_cost = ${data.dailyCost || 8},
        motivation = ${data.motivation || null},
        pledge_date = ${data.pledgeDate || null},
        updated_at = CURRENT_TIMESTAMP
    `;

    return { success: true };
  } catch (error) {
    console.error("Failed to save user sobriety data:", error);
    return { success: false, error };
  }
}

// Delete user sobriety data (for reset)
export async function deleteUserSobrietyData(
  fid: number
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await sql`DELETE FROM user_sobriety WHERE fid = ${fid}`;
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user sobriety data:", error);
    return { success: false, error };
  }
}

// Update only the pledge date
export async function updatePledgeDate(
  fid: number,
  pledgeDate: string,
  motivation?: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await sql`
      UPDATE user_sobriety 
      SET pledge_date = ${pledgeDate}, 
          motivation = ${motivation || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE fid = ${fid}
    `;
    return { success: true };
  } catch (error) {
    console.error("Failed to update pledge date:", error);
    return { success: false, error };
  }
}

// Update daily cost
export async function updateDailyCost(
  fid: number,
  dailyCost: number
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await sql`
      UPDATE user_sobriety 
      SET daily_cost = ${dailyCost},
          updated_at = CURRENT_TIMESTAMP
      WHERE fid = ${fid}
    `;
    return { success: true };
  } catch (error) {
    console.error("Failed to update daily cost:", error);
    return { success: false, error };
  }
}
