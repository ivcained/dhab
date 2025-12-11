import { NextRequest, NextResponse } from "next/server";
import {
  initializeCommunityTables,
  createCommunityPost,
  getCommunityPosts,
  getPostComments,
  addPostComment,
  getPostReactions,
  togglePostReaction,
  flagContent,
  hasUserFlagged,
} from "~/lib/db";

// Initialize tables on first request
let tablesInitialized = false;

async function ensureTablesExist() {
  if (!tablesInitialized) {
    await initializeCommunityTables();
    tablesInitialized = true;
  }
}

// GET - Fetch posts for an addiction
export async function GET(request: NextRequest) {
  try {
    await ensureTablesExist();

    const { searchParams } = new URL(request.url);
    const addiction = searchParams.get("addiction");
    const postId = searchParams.get("postId");
    const action = searchParams.get("action");

    if (!addiction) {
      return NextResponse.json(
        { error: "Addiction parameter is required" },
        { status: 400 }
      );
    }

    // Get comments for a specific post
    if (postId && action === "comments") {
      const comments = await getPostComments(postId);
      return NextResponse.json({ comments });
    }

    // Get reactions for a specific post
    if (postId && action === "reactions") {
      const reactions = await getPostReactions(postId);
      return NextResponse.json({ reactions });
    }

    // Get all posts for addiction
    const posts = await getCommunityPosts(addiction);

    // For each post, get comments and reactions
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const comments = await getPostComments(post.id);
        const reactions = await getPostReactions(post.id);
        return {
          ...post,
          comments,
          reactions,
        };
      })
    );

    return NextResponse.json({ posts: postsWithDetails });
  } catch (error) {
    console.error("Error fetching community posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST - Create post, add comment, toggle reaction, or flag content
export async function POST(request: NextRequest) {
  try {
    await ensureTablesExist();

    const body = await request.json();
    const { action } = body;

    // Create a new post
    if (action === "create_post") {
      const { id, anonymousId, addiction, content, milestone, timestamp } =
        body;

      if (!id || !anonymousId || !addiction || !content || !timestamp) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const result = await createCommunityPost({
        id,
        anonymousId,
        addiction,
        content,
        milestone,
        timestamp,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: "Failed to create post" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Add a comment
    if (action === "add_comment") {
      const { id, postId, anonymousId, content, timestamp } = body;

      if (!id || !postId || !anonymousId || !content || !timestamp) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const result = await addPostComment({
        id,
        postId,
        anonymousId,
        content,
        timestamp,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: "Failed to add comment" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Toggle reaction
    if (action === "toggle_reaction") {
      const { postId, anonymousId, emoji } = body;

      if (!postId || !anonymousId || !emoji) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const result = await togglePostReaction(postId, anonymousId, emoji);

      if (!result.success) {
        return NextResponse.json(
          { error: "Failed to toggle reaction" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, added: result.added });
    }

    // Flag content
    if (action === "flag") {
      const { targetType, targetId, anonymousId } = body;

      if (!targetType || !targetId || !anonymousId) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Check if already flagged
      const alreadyFlagged = await hasUserFlagged(
        targetType,
        targetId,
        anonymousId
      );

      if (alreadyFlagged) {
        return NextResponse.json({
          success: true,
          alreadyFlagged: true,
        });
      }

      const result = await flagContent(targetType, targetId, anonymousId);

      if (!result.success) {
        return NextResponse.json(
          { error: "Failed to flag content" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        alreadyFlagged: false,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in community POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
