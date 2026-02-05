import React, { useEffect, useState } from "react";
import { Heart, Search } from "lucide-react";

const API_URL = "http://localhost:3000";

const App = () => {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");

  const token = localStorage.getItem("token");

  const fetchPosts = async () => {
    const res = await fetch(`${API_URL}/api/v1/posts/bulk`, {
      headers: {
        Authorization: `Bearer ${token}` || "",
      },
    });

    const data = await res.json();

    if (!data.error) {
      const postsWithLikes = await Promise.all(
        data.allPosts.map(async (post) => {
          const likeRes = await fetch(
            `${API_URL}/api/v1/post/like/${post.id}`,
            {
              headers: { Authorization: `Bearer ${token}` || "" },
            }
          );
          const likeData = await likeRes.json();

          return {
            ...post,
            likes: likeData.likes ?? 0,
            color: "bg-pink-50",
            date: new Date(post.created_at).toLocaleString(),
          };
        })
      );

      setPosts(postsWithLikes);
    }
  };

  const createPost = async () => {
    if (!text.trim()) return;

    await fetch(`${API_URL}/api/v1/createPost`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` || "",
      },
      body: JSON.stringify({
        text,
        categories: ["funny"],
      }),
    });

    setText("");
    fetchPosts();
  };

  const likePost = async (postId) => {
    await fetch(`${API_URL}/api/v1/like/${postId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}` || "",
      },
    });

    fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-[#fff5f7] font-sans text-gray-700">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-semibold text-pink-400 tracking-tight">
            Campus Whisper
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search confessions..."
            className="px-4 py-1.5 border border-pink-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <button className="bg-pink-300 hover:bg-pink-400 text-white px-4 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1">
            <Search size={14} /> Search
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header className="py-12 text-center bg-white border-b border-pink-50">
        <h1 className="text-4xl font-serif italic text-pink-400">
          Your Own Confession Wall
        </h1>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        {/* Create Post */}
        <div className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write my own confession post! ✨"
            className="w-full h-32 p-4 text-gray-600 bg-pink-50/30 rounded-xl border-none focus:ring-2 focus:ring-pink-200 resize-none"
          />
          <button
            onClick={createPost}
            className="mt-4 bg-teal-300 hover:bg-teal-400 text-white font-medium py-2 px-8 rounded-lg transition-all shadow-md active:scale-95"
          >
            Submit
          </button>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`${post.color} p-6 rounded-3xl shadow-sm border border-white flex flex-col items-center text-center transition-transform hover:scale-[1.02]`}
            >
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-medium">
                {post.date}
              </p>

              <div className="grow flex items-center justify-center mb-6">
                <p className="text-sm font-medium leading-relaxed">
                  {post.text}
                </p>
              </div>

              <div className="flex items-center gap-4 border-t border-white/50 pt-4 w-full justify-center">
                <button
                  onClick={() => likePost(post.id)}
                  className="flex items-center gap-1 group"
                >
                  <Heart
                    size={18}
                    className="text-pink-400 group-hover:fill-pink-400 transition-colors"
                  />
                  <span className="text-xs text-gray-500">
                    {post.likes}
                  </span>
                </button>
              </div>

              <button className="mt-3 text-[10px] text-teal-400 font-bold uppercase tracking-tighter hover:underline">
                View
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
