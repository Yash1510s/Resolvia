'use client';

import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Flag, Lock, Info } from 'lucide-react';
import { CommunityPost, DisputeCase } from '../types';
import { useApp } from '../lib/app-context';

interface Props {
  dispute: DisputeCase;
}

export function CommunityDiscussion({ dispute }: Props) {
  const { identity, addDiscussionPost, myJurorPseudonym } = useApp();
  const [body, setBody] = useState('');

  if (dispute.status !== 'CLOSED') {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Community Discussion Opens After Final Closure</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            To protect the integrity of an active dispute, <strong>there is no open conversation during the case</strong>.
            Parties communicate only through the formal claim, response, and evidence channels. This space unlocks once the
            verdict is final and the case is closed.
          </p>
        </div>
      </div>
    );
  }

  const posts = dispute.discussion || [];

  const handlePost = () => {
    if (!body.trim()) return;
    addDiscussionPost(dispute.id, {
      author: identity.name,
      authorRole: 'Community',
      body: body.trim(),
    });
    setBody('');
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-indigo-800 leading-relaxed">
          This is a <strong>post-closure community space</strong> attached to {dispute.caseNumber}. It exists for learning
          and reflection. It <strong>cannot change the verdict and is not an appeal</strong>. Jurors participate
          anonymously. Be respectful — reports are reviewed.
        </p>
      </div>

      {/* Compose */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
            {identity.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900">{identity.name}</p>
            <p className="text-[9px] text-slate-400">Community</p>
          </div>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Share a lesson, ask a question, or note what made this case instructive…"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            You can also post as your juror pseudonym <span className="font-mono text-slate-500">{myJurorPseudonym}</span> if
            you served on this panel.
          </p>
          <button
            onClick={handlePost}
            disabled={!body.trim()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Post
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No discussion yet. Be the first to start one.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: CommunityPost }) {
  const isJuror = post.authorRole === 'Juror (anonymous)';
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${
              isJuror ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isJuror ? post.authorBadge?.replace('Juror ', '') : post.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 flex items-center gap-2">
              {post.author}
              {isJuror && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  ANONYMOUS JUROR
                </span>
              )}
            </p>
            <p className="text-[9px] text-slate-400">{new Date(post.createdAt).toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" /> {post.likes}
          </span>
          <span className="flex items-center gap-1">
            <Flag className="w-3.5 h-3.5" /> {post.reports}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-700 leading-relaxed mt-3">{post.body}</p>
      {post.replies && post.replies.length > 0 && (
        <div className="mt-3 space-y-2 pl-3 border-l-2 border-slate-100">
          {post.replies.map((r) => (
            <PostCard key={r.id} post={r} />
          ))}
        </div>
      )}
    </div>
  );
}
