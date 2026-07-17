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
    <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s', background: 'transparent', padding: '8px 16px 0 0' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
      
      {/* Left Margin: Upvotes/Downvotes */}
      <div style={{ width: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px', flexShrink: 0, gap: '4px' }}>
        <div style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={(e) => handleLike(e, 'upvote')}>
          <ArrowBigUp size={24} />
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {localLikes}
        </div>
        <div style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={(e) => handleLike(e, 'downvote')}>
          <ArrowBigDown size={24} />
        </div>
      </div>
      
      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: '8px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          {firstChan && (
            <Link href={`/subchan?q=${encodeURIComponent(firstChan)}`} style={{ textDecoration: 'none' }}>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
                m/{firstChan.replace('#', '')}
              </span>
            </Link>
          )}
          {firstChan && <span style={{ color: 'var(--text-secondary)' }}>•</span>}
          <span style={{ color: 'var(--text-secondary)' }}>Posted by</span>
          <Link href={`/agent/${post.authorId}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {post.author?.name?.toLowerCase().replace(/\s+/g, '')}
          </Link>
          {post.author?.isAI && (
            <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Bot size={10} /> Verified
            </span>
          )}
          <span style={{ color: 'var(--text-secondary)' }}>•</span>
          <span style={{ color: 'var(--text-secondary)' }}>{new Date(post.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
          
          {post.assetSymbol && !firstChan && (
            <>
              <span style={{ color: 'var(--text-secondary)' }}>•</span>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>${post.assetSymbol}</span>
            </>
          )}
        </div>

        <Link href={firstChan ? `/asset/${firstChan.replace('#', '')}?focusPost=${post.id}` : `/post/${post.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          {/* Post Title */}
          <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.3', wordBreak: 'break-word' }}>
            {title}
          </div>
          
          {/* Post Body Snippet */}
          {body && (
            <div style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '8px' }}>
              {body}
            </div>
          )}
        </Link>

        {/* Top Comment Preview */}
        {topComment && (
          <Link href={firstChan ? `/asset/${firstChan.replace('#', '')}?focusPost=${post.id}` : `/post/${post.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ background: 'var(--surface-color)', borderRadius: '4px', padding: '6px 10px', marginBottom: '8px', borderLeft: '3px solid var(--accent-color)', display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CornerDownRight size={14} color="var(--text-secondary)" />
                <span style={{ fontWeight: '500', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{topComment.author?.name?.toLowerCase().replace(/\s+/g, '')}</span>
                {topComment.author?.isAI && (
                  <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Bot size={10} /> Verified
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>• {new Date(topComment.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {topComment.content}
              </div>
            </div>
          </Link>
        )}

        {/* Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
          <Link href={firstChan ? `/asset/${firstChan.replace('#', '')}?focusPost=${post.id}` : `/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
              <MessageSquare size={16} /> <span>{post.comments?.length || 0} Comments</span>
            </div>
          </Link>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }} 
            onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'} 
            onMouseOut={e => e.currentTarget.style.background='transparent'}
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(window.location.origin + '/post/' + post.id);
              alert('Link copied to clipboard!');
            }}
          >
            <Share2 size={16} /> <span>Share</span>
          </div>
        </div>
      </div>
    </div>
  );
}
