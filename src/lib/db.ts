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
  walletAddress?: string;
  authStrategy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommunityPost {
  id: string;
  anonymousId: string;
  addiction: string;
  content: string;
  milestone?: string;
  timestamp: number;
  reactions: string; // JSON string of reactions
  flagCount: number;
  createdAt?: Date;
}

export interface CommunityComment {
  id: string;
  postId: string;
  anonymousId: string;
  content: string;
  timestamp: number;
  flagCount: number;
  createdAt?: Date;
}

export interface CommunityReaction {
  id: string;
  postId: string;
  anonymousId: string;
  emoji: string;
  createdAt?: Date;
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
        wallet_address VARCHAR(42),
        auth_strategy VARCHAR(50),
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
        wallet_address as "walletAddress",
        auth_strategy as "authStrategy",
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
        daily_cost, motivation, pledge_date, wallet_address, auth_strategy, updated_at
      ) VALUES (
        ${data.fid},
        ${data.startDate},
        ${data.startTime || null},
        ${data.addiction},
        ${data.customAddiction || null},
        ${data.dailyCost || 8},
        ${data.motivation || null},
        ${data.pledgeDate || null},
        ${data.walletAddress || null},
        ${data.authStrategy || null},
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
        wallet_address = COALESCE(${
          data.walletAddress || null
        }, user_sobriety.wallet_address),
        auth_strategy = COALESCE(${
          data.authStrategy || null
        }, user_sobriety.auth_strategy),
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

// ============================================
// Community Posts Database Functions
// ============================================

// Initialize community tables
export async function initializeCommunityTables() {
  try {
    // Posts table
    await sql`
      CREATE TABLE IF NOT EXISTS community_posts (
        id VARCHAR(50) PRIMARY KEY,
        anonymous_id VARCHAR(100) NOT NULL,
        addiction VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        milestone VARCHAR(100),
        timestamp BIGINT NOT NULL,
        flag_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Comments table
    await sql`
      CREATE TABLE IF NOT EXISTS community_comments (
        id VARCHAR(50) PRIMARY KEY,
        post_id VARCHAR(50) NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        anonymous_id VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        flag_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Reactions table
    await sql`
      CREATE TABLE IF NOT EXISTS community_reactions (
        id VARCHAR(100) PRIMARY KEY,
        post_id VARCHAR(50) NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        anonymous_id VARCHAR(100) NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, anonymous_id, emoji)
      )
    `;

    // Flags table (to track who flagged what)
    await sql`
      CREATE TABLE IF NOT EXISTS community_flags (
        id VARCHAR(100) PRIMARY KEY,
        target_type VARCHAR(10) NOT NULL,
        target_id VARCHAR(50) NOT NULL,
        anonymous_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(target_type, target_id, anonymous_id)
      )
    `;

    return { success: true };
  } catch (error) {
    console.error("Failed to initialize community tables:", error);
    return { success: false, error };
  }
}

// Create a new post
export async function createCommunityPost(post: {
  id: string;
  anonymousId: string;
  addiction: string;
  content: string;
  milestone?: string;
  timestamp: number;
}): Promise<{ success: boolean; error?: unknown }> {
  try {
    await sql`
      INSERT INTO community_posts (id, anonymous_id, addiction, content, milestone, timestamp)
      VALUES (${post.id}, ${post.anonymousId}, ${post.addiction}, ${
      post.content
    }, ${post.milestone || null}, ${post.timestamp})
    `;
    return { success: true };
  } catch (error) {
    console.error("Failed to create community post:", error);
    return { success: false, error };
  }
}

// Get posts by addiction
export async function getCommunityPosts(
  addiction: string
): Promise<CommunityPost[]> {
  try {
    const result = await sql`
      SELECT
        id,
        anonymous_id as "anonymousId",
        addiction,
        content,
        milestone,
        timestamp,
        flag_count as "flagCount",
        created_at as "createdAt"
      FROM community_posts
      WHERE addiction = ${addiction}
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    return result.rows as CommunityPost[];
  } catch (error) {
    console.error("Failed to get community posts:", error);
    return [];
  }
}

// Get comments for a post
export async function getPostComments(
  postId: string
): Promise<CommunityComment[]> {
  try {
    const result = await sql`
      SELECT
        id,
        post_id as "postId",
        anonymous_id as "anonymousId",
        content,
        timestamp,
        flag_count as "flagCount",
        created_at as "createdAt"
      FROM community_comments
      WHERE post_id = ${postId}
      ORDER BY timestamp ASC
    `;
    return result.rows as CommunityComment[];
  } catch (error) {
    console.error("Failed to get post comments:", error);
    return [];
  }
}

// Add a comment to a post
export async function addPostComment(comment: {
  id: string;
  postId: string;
  anonymousId: string;
  content: string;
  timestamp: number;
}): Promise<{ success: boolean; error?: unknown }> {
  try {
    await sql`
      INSERT INTO community_comments (id, post_id, anonymous_id, content, timestamp)
      VALUES (${comment.id}, ${comment.postId}, ${comment.anonymousId}, ${comment.content}, ${comment.timestamp})
    `;
    return { success: true };
  } catch (error) {
    console.error("Failed to add comment:", error);
    return { success: false, error };
  }
}

// Get reactions for a post
export async function getPostReactions(
  postId: string
): Promise<{ emoji: string; count: number; users: string[] }[]> {
  try {
    const result = await sql`
      SELECT emoji, COUNT(*) as count, ARRAY_AGG(anonymous_id) as users
      FROM community_reactions
      WHERE post_id = ${postId}
      GROUP BY emoji
    `;
    return result.rows.map((row) => ({
      emoji: row.emoji,
      count: Number(row.count),
      users: row.users as string[],
    }));
  } catch (error) {
    console.error("Failed to get post reactions:", error);
    return [];
  }
}

// Toggle reaction on a post
export async function togglePostReaction(
  postId: string,
  anonymousId: string,
  emoji: string
): Promise<{ success: boolean; added: boolean; error?: unknown }> {
  try {
    const reactionId = `${postId}-${anonymousId}-${emoji}`;

    // Check if reaction exists
    const existing = await sql`
      SELECT id FROM community_reactions WHERE id = ${reactionId}
    `;

    if (existing.rows.length > 0) {
      // Remove reaction
      await sql`DELETE FROM community_reactions WHERE id = ${reactionId}`;
      return { success: true, added: false };
    } else {
      // Add reaction
      await sql`
        INSERT INTO community_reactions (id, post_id, anonymous_id, emoji)
        VALUES (${reactionId}, ${postId}, ${anonymousId}, ${emoji})
      `;
      return { success: true, added: true };
    }
  } catch (error) {
    console.error("Failed to toggle reaction:", error);
    return { success: false, added: false, error };
  }
}

// Flag a post or comment
export async function flagContent(
  targetType: "post" | "comment",
  targetId: string,
  anonymousId: string
): Promise<{ success: boolean; alreadyFlagged: boolean; error?: unknown }> {
  try {
    const flagId = `${targetType}-${targetId}-${anonymousId}`;

    // Check if already flagged
    const existing = await sql`
      SELECT id FROM community_flags WHERE id = ${flagId}
    `;

    if (existing.rows.length > 0) {
      return { success: true, alreadyFlagged: true };
    }

    // Add flag
    await sql`
      INSERT INTO community_flags (id, target_type, target_id, anonymous_id)
      VALUES (${flagId}, ${targetType}, ${targetId}, ${anonymousId})
    `;

    // Update flag count
    if (targetType === "post") {
      await sql`
        UPDATE community_posts SET flag_count = flag_count + 1 WHERE id = ${targetId}
      `;
    } else {
      await sql`
        UPDATE community_comments SET flag_count = flag_count + 1 WHERE id = ${targetId}
      `;
    }

    return { success: true, alreadyFlagged: false };
  } catch (error) {
    console.error("Failed to flag content:", error);
    return { success: false, alreadyFlagged: false, error };
  }
}

// Check if user has flagged content
export async function hasUserFlagged(
  targetType: "post" | "comment",
  targetId: string,
  anonymousId: string
): Promise<boolean> {
  try {
    const flagId = `${targetType}-${targetId}-${anonymousId}`;
    const result = await sql`
      SELECT id FROM community_flags WHERE id = ${flagId}
    `;
    return result.rows.length > 0;
  } catch (error) {
    console.error("Failed to check flag status:", error);
    return false;
  }
}
