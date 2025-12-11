"use client";

import React, { useState, useEffect } from "react";
import {
  Post,
  Comment,
  FLAG_THRESHOLD,
  formatTimeAgo,
  getDefaultReactions,
  getSamplePosts,
} from "~/lib/community";

interface CommunityViewProps {
  addiction: string;
  userAnonymousId: string;
  onBack: () => void;
}

export default function CommunityView({
  addiction,
  userAnonymousId,
  onBack,
}: CommunityViewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostMilestone, setNewPostMilestone] = useState("");
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  // Transform database reactions to Post reactions format
  const transformReactions = React.useCallback(
    (dbReactions: { emoji: string; count: number; users: string[] }[]) => {
      const defaultReactions = getDefaultReactions();
      return defaultReactions.map((defaultR) => {
        const dbReaction = dbReactions.find((r) => r.emoji === defaultR.emoji);
        return {
          emoji: defaultR.emoji,
          count: dbReaction?.count || 0,
          userReacted: dbReaction?.users?.includes(userAnonymousId) || false,
        };
      });
    },
    [userAnonymousId]
  );

  // Load posts from database
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch(
          `/api/community?addiction=${encodeURIComponent(addiction)}`
        );
        const data = await response.json();

        if (data.posts && data.posts.length > 0) {
          // Transform database posts to match Post interface
          const transformedPosts: Post[] = data.posts.map(
            (dbPost: {
              id: string;
              anonymousId: string;
              content: string;
              milestone?: string;
              timestamp: number;
              reactions?: { emoji: string; count: number; users: string[] }[];
              comments?: {
                id: string;
                anonymousId: string;
                content: string;
                timestamp: number;
                flagCount: number;
              }[];
              flagCount: number;
            }) => ({
              id: dbPost.id,
              anonymousId: dbPost.anonymousId,
              content: dbPost.content,
              milestone: dbPost.milestone,
              timestamp: dbPost.timestamp,
              reactions: transformReactions(dbPost.reactions || []),
              comments:
                dbPost.comments?.map((c) => ({
                  id: c.id,
                  anonymousId: c.anonymousId,
                  content: c.content,
                  timestamp: c.timestamp,
                  flagCount: c.flagCount || 0,
                  flaggedByUser: false, // Will be checked separately if needed
                })) || [],
              flagCount: dbPost.flagCount || 0,
              flaggedByUser: false, // Will be checked separately if needed
            })
          );
          setPosts(transformedPosts);
        } else {
          // Fallback to sample posts if no database posts
          setPosts(getSamplePosts());
        }
      } catch (error) {
        console.error("Failed to load posts from database:", error);
        // Fallback to localStorage or sample posts
        const saved = localStorage.getItem(`community_posts_${addiction}`);
        if (saved) setPosts(JSON.parse(saved));
        else setPosts(getSamplePosts());
      }
    };

    loadPosts();
  }, [addiction, transformReactions]);

  const savePosts = (newPosts: Post[]) => {
    setPosts(newPosts);
    // Keep localStorage as backup
    localStorage.setItem(
      `community_posts_${addiction}`,
      JSON.stringify(newPosts)
    );
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      anonymousId: userAnonymousId,
      content: newPostContent,
      milestone: newPostMilestone || undefined,
      timestamp: Date.now(),
      reactions: getDefaultReactions(),
      comments: [],
      flagCount: 0,
      flaggedByUser: false,
    };

    // Save to database
    try {
      await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_post",
          id: newPost.id,
          anonymousId: newPost.anonymousId,
          addiction,
          content: newPost.content,
          milestone: newPost.milestone,
          timestamp: newPost.timestamp,
        }),
      });
    } catch (error) {
      console.error("Failed to save post to database:", error);
    }

    // Update local state
    savePosts([newPost, ...posts]);
    setNewPostContent("");
    setNewPostMilestone("");
    setShowNewPost(false);
  };

  const handleReaction = async (postId: string, emoji: string) => {
    // Save to database
    try {
      await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_reaction",
          postId,
          anonymousId: userAnonymousId,
          emoji,
        }),
      });
    } catch (error) {
      console.error("Failed to save reaction to database:", error);
    }

    // Update local state
    savePosts(
      posts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          reactions: post.reactions.map((r) =>
            r.emoji === emoji
              ? {
                  ...r,
                  count: r.userReacted ? r.count - 1 : r.count + 1,
                  userReacted: !r.userReacted,
                }
              : r
          ),
        };
      })
    );
  };

  const handleAddComment = async (postId: string) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    const comment: Comment = {
      id: Date.now().toString(),
      anonymousId: userAnonymousId,
      content,
      timestamp: Date.now(),
      flagCount: 0,
      flaggedByUser: false,
    };

    // Save to database
    try {
      await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_comment",
          id: comment.id,
          postId,
          anonymousId: comment.anonymousId,
          content: comment.content,
          timestamp: comment.timestamp,
        }),
      });
    } catch (error) {
      console.error("Failed to save comment to database:", error);
    }

    // Update local state
    savePosts(
      posts.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    );
    setNewComment({ ...newComment, [postId]: "" });
  };

  const handleFlagPost = async (postId: string) => {
    // Save to database
    try {
      await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "flag",
          targetType: "post",
          targetId: postId,
          anonymousId: userAnonymousId,
        }),
      });
    } catch (error) {
      console.error("Failed to flag post in database:", error);
    }

    // Update local state
    savePosts(
      posts.map((post) =>
        post.id === postId && !post.flaggedByUser
          ? { ...post, flagCount: post.flagCount + 1, flaggedByUser: true }
          : post
      )
    );
  };

  const handleFlagComment = async (postId: string, commentId: string) => {
    // Save to database
    try {
      await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "flag",
          targetType: "comment",
          targetId: commentId,
          anonymousId: userAnonymousId,
        }),
      });
    } catch (error) {
      console.error("Failed to flag comment in database:", error);
    }

    // Update local state
    savePosts(
      posts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: post.comments.map((c) =>
            c.id === commentId && !c.flaggedByUser
              ? { ...c, flagCount: c.flagCount + 1, flaggedByUser: true }
              : c
          ),
        };
      })
    );
  };

  const visiblePosts = posts.filter((p) => p.flagCount < FLAG_THRESHOLD);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onBack} className="text-slate-600">
              ‹ Back
            </button>
            <div className="flex gap-4">
              <span className="text-cyan-500 font-semibold border-b-2 border-cyan-500 pb-1">
                Communities
              </span>
              <span className="text-slate-400">Following</span>
              <span className="text-slate-400">Groups</span>
            </div>
            <div className="w-12" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-slate-600">≡</span>
            <span className="font-semibold text-slate-800">{addiction}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {["3weeks", "25days", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeFilter === f
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {f === "3weeks"
                  ? "3 Weeks"
                  : f === "25days"
                  ? "25 Days"
                  : "All milestones"}
              </button>
            ))}
          </div>
        </div>

        {/* New Post Button */}
        <div className="p-4">
          <button
            onClick={() => setShowNewPost(true)}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium shadow-lg"
          >
            + Share Your Journey (Anonymous)
          </button>
        </div>

        {/* New Post Modal */}
        {showNewPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Share Anonymously</h3>
                <button
                  onClick={() => setShowNewPost(false)}
                  className="text-slate-400 text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="mb-4 p-3 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-600">
                  Posting as:{" "}
                  <span className="font-semibold text-cyan-600">
                    {userAnonymousId}
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  🔒 Your identity is protected using ZK-proof anonymization
                </p>
              </div>
              <select
                value={newPostMilestone}
                onChange={(e) => setNewPostMilestone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-3"
                aria-label="Select milestone"
              >
                <option value="">No milestone</option>
                <option value="🎉 Milestone Reached!">
                  🎉 Milestone Reached!
                </option>
                <option value="💪 Staying Strong">💪 Staying Strong</option>
                <option value="🆘 Need Support">🆘 Need Support</option>
              </select>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your thoughts, progress, or ask for support..."
                className="w-full px-4 py-3 border border-slate-200 rounded-lg h-32 resize-none"
              />
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className="w-full mt-4 py-3 bg-cyan-500 text-white rounded-xl font-medium disabled:bg-slate-300"
              >
                Post Anonymously
              </button>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-4 px-4 pb-24">
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="p-4">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {post.anonymousId.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {post.anonymousId}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTimeAgo(post.timestamp)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFlagPost(post.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      post.flaggedByUser
                        ? "text-red-500 bg-red-50"
                        : "text-slate-400 hover:bg-slate-100"
                    }`}
                    title="Flag for review"
                  >
                    {post.flaggedByUser ? "Flagged" : "•••"}
                  </button>
                </div>

                {/* Milestone Badge */}
                {post.milestone && (
                  <div className="mb-3 px-3 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                    <p className="text-cyan-700 font-medium">
                      {post.milestone}
                    </p>
                  </div>
                )}

                {/* Content */}
                <p className="text-slate-700 leading-relaxed mb-4">
                  {post.content}
                </p>

                {/* Reactions */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.reactions
                    .filter((r) => r.count > 0 || r.userReacted)
                    .map((r) => (
                      <button
                        key={r.emoji}
                        onClick={() => handleReaction(post.id, r.emoji)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                          r.userReacted
                            ? "bg-cyan-100 text-cyan-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span>{r.emoji}</span>
                        <span>{r.count}</span>
                      </button>
                    ))}
                  {/* Add reaction button */}
                  <div className="relative group">
                    <button className="px-2 py-1 rounded-full text-sm bg-slate-100 text-slate-400 hover:bg-slate-200">
                      +
                    </button>
                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex gap-1 bg-white shadow-lg rounded-lg p-2 border">
                      {["👍", "❤️", "👏", "💪", "🎉", "😢"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(post.id, emoji)}
                          className="hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comments Toggle */}
                <button
                  onClick={() =>
                    setExpandedComments(
                      expandedComments === post.id ? null : post.id
                    )
                  }
                  className="text-cyan-600 text-sm font-medium"
                >
                  {expandedComments === post.id
                    ? "Hide comments"
                    : `Add a comment ${
                        post.comments.length > 0
                          ? `(${post.comments.length})`
                          : ""
                      }`}
                </button>

                {/* Comments Section */}
                {expandedComments === post.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {post.comments
                      .filter((c) => c.flagCount < FLAG_THRESHOLD)
                      .map((comment) => (
                        <div
                          key={comment.id}
                          className="mb-3 pl-4 border-l-2 border-slate-200"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">
                              {comment.anonymousId}
                            </p>
                            <button
                              onClick={() =>
                                handleFlagComment(post.id, comment.id)
                              }
                              className={`text-xs ${
                                comment.flaggedByUser
                                  ? "text-red-400"
                                  : "text-slate-300 hover:text-red-400"
                              }`}
                            >
                              {comment.flaggedByUser ? "⚑" : "⚐"}
                            </button>
                          </div>
                          <p className="text-sm text-slate-600">
                            {comment.content}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatTimeAgo(comment.timestamp)}
                          </p>
                        </div>
                      ))}
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={newComment[post.id] || ""}
                        onChange={(e) =>
                          setNewComment({
                            ...newComment,
                            [post.id]: e.target.value,
                          })
                        }
                        placeholder="Write a supportive comment..."
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddComment(post.id)
                        }
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Moderation Info */}
        <div className="fixed bottom-20 left-0 right-0 px-4">
          <div className="max-w-lg mx-auto bg-slate-800 text-white text-xs p-3 rounded-lg text-center">
            🛡️ Community moderated by consensus voting. Posts with{" "}
            {FLAG_THRESHOLD}+ flags are hidden.
          </div>
        </div>
      </div>
    </div>
  );
}
