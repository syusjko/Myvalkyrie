"use client";

import Link from 'next/link';
import { Bot, User as UserIcon, MessageSquare, ArrowBigUp, ArrowBigDown, Share2, CornerDownRight } from 'lucide-react';
import { useState } from 'react';

export default function PostPreviewCard({ post }: { post: any }) {
  const [localLikes, setLocalLikes] = useState(post.likes || 0);

  const handleLike = async (e: React.MouseEvent, action: 'upvote' | 'downvote') => {
    e.preventDefault(); // Prevent navigating to post detail page
    if (action === 'upvote') setLocalLikes((prev: number) => prev + 1);
    if (action === 'downvote' && localLikes > 0) setLocalLikes((prev: number) => prev - 1);

    try {
      await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  // Extract Title: take first sentence or first line, max 80 chars
  const lines = post.content.split('\n');
  let title = lines[0];
  const firstSentence = post.content.split(/[.?!]/)[0];
  if (firstSentence.length < title.length && firstSentence.length > 5) {
    title = firstSentence + (post.content[firstSentence.length] || '');
  }
  if (title.length > 80) title = title.substring(0, 80) + '...';

  // Extract Body: remove title from content and truncate
  let body = post.content.substring(title.length).trim();
  if (body.startsWith('\n')) body = body.substring(1).trim();
  const isTruncated = body.length > 150;
  if (isTruncated) body = body.substring(0, 150) + '...';

  // Top Comment
  const topComment = post.comments && post.comments.length > 0 ? post.comments[0] : null;

  // Extract Chan from DB symbol or hashtags
  const hashtags = post.content.match(/#[a-zA-Z0-9_]+/g) || [];
  const firstChan = post.symbol ? `#${post.symbol}` : (hashtags.length > 0 ? hashtags[0] : null);

  return (
    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', transition: 'background 0.2s', background: 'var(--bg-color)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg-color)'}>
      <div style={{ marginRight: '16px', flexShrink: 0 }}>
        <Link href={`/agent/${post.authorId}`}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: post.author?.isAI ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {post.author?.isAI ? <Bot size={24} color="#fff" /> : <UserIcon size={24} color="#fff" />}
          </div>
        </Link>
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <Link href={`/agent/${post.authorId}`} style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
            {post.author?.name}
          </Link>
          {post.author?.isAI && <span style={{ fontSize: '0.65rem', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '2px 4px', borderRadius: '4px' }}>AI</span>}
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>@{post.author?.name?.toLowerCase().replace(/\s+/g, '')}</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>·</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{new Date(post.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
          
          {firstChan && (
            <Link href={`/subchan?q=${encodeURIComponent(firstChan)}`} style={{ textDecoration: 'none' }}>
              <span style={{ marginLeft: '4px', color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer' }}>
                {firstChan.toUpperCase()}
              </span>
            </Link>
          )}

          {post.assetSymbol && (
            <span style={{ marginLeft: 'auto', color: 'var(--accent-color)', fontSize: '0.8rem', fontWeight: 'bold' }}>
              ${post.assetSymbol}
            </span>
          )}
        </div>
        
        <Link href={firstChan ? `/asset/${firstChan.replace('#', '')}?focusPost=${post.id}` : `/post/${post.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          {/* Post Title */}
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.4', wordBreak: 'break-word' }}>
            {title}
          </div>
          
          {/* Post Body Snippet */}
          {body && (
            <div style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '16px' }}>
              {body}
            </div>
          )}
        </Link>

        {/* Top Comment Preview */}
        {topComment && (
          <Link href={firstChan ? `/asset/${firstChan.replace('#', '')}?focusPost=${post.id}` : `/post/${post.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ background: 'var(--surface-color)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', border: '1px solid var(--glass-border)', display: 'flex', gap: '12px' }}>
              <div style={{ color: 'var(--text-secondary)', paddingTop: '2px' }}>
                <CornerDownRight size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{topComment.author?.name}</span>
                  {topComment.author?.isAI && <span style={{ fontSize: '0.55rem', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '2px 4px', borderRadius: '4px' }}>AI</span>}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Best Comment</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {topComment.content}
                </div>
              </div>
            </div>
          </Link>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '400px', color: 'var(--text-secondary)' }}>
          <Link href={firstChan ? `/asset/${firstChan.replace('#', '')}?focusPost=${post.id}` : `/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.color='#3b82f6'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>
              <MessageSquare size={18} /> <span style={{ fontSize: '0.9rem' }}>{post.comments?.length || 0}</span>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <ArrowBigUp size={20} /> 
            <span style={{ fontSize: '0.9rem' }}>{post.likes || 0}</span> 
            <ArrowBigDown size={20} />
          </div>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} 
            onMouseOver={e => e.currentTarget.style.color='#10b981'} 
            onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(window.location.origin + '/post/' + post.id);
              alert('Link copied to clipboard!');
            }}
          >
            <Share2 size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
