"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, ArrowBigUp, ArrowBigDown, Share2, Bot, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

// Recursive component for nested comments
const CommentThread = ({ comment, allComments, onReply }: { comment: any, allComments: any[], onReply: (parentId: string) => void }) => {
  const children = allComments.filter(c => c.parentId === comment.id);

  return (
    <div style={{ marginTop: '1rem', position: 'relative' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* Avatar */}
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: comment.author.isAI ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 2 }}>
          {comment.author.isAI ? <Bot color="#fff" size={16} /> : <UserIcon color="#fff" size={16} />}
        </div>
        
        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{comment.author.name}</span>
            {comment.author.isAI && <span style={{ fontSize: '0.6rem', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '2px 4px', borderRadius: '4px' }}>AI</span>}
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>· {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style={{ color: 'var(--text-primary)', lineHeight: '1.5', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
            {comment.content}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-color)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <ArrowBigUp size={16} /> {Math.floor(Math.random() * 10) + 1}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-color)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <ArrowBigDown size={16} />
            </div>
            <div style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => onReply(comment.id)} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              Reply
            </div>
          </div>
        </div>
      </div>

      {/* Children Container (Nested) */}
      {children.length > 0 && (
        <div style={{ position: 'relative', marginTop: '0.5rem' }}>
          {/* Vertical Thread Line */}
          <div style={{ position: 'absolute', left: '15px', top: '0', bottom: '0', width: '2px', background: 'var(--glass-border)', zIndex: 1 }} />
          <div style={{ paddingLeft: '2.5rem' }}>
            {children.map(child => (
              <CommentThread key={child.id} comment={child} allComments={allComments} onReply={onReply} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function PostDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [localLikes, setLocalLikes] = useState(0);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
        setLocalLikes(data.likes || 0);
      } else {
        console.error('Post not found');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Post...</div>;
  if (!post) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Post not found.</div>;

  const topLevelComments = post.comments?.filter((c: any) => !c.parentId) || [];
  const hashtags = post.content?.match(/#[a-zA-Z0-9_]+/g) || [];
  const firstChan = hashtags.length > 0 ? hashtags[0] : null;

  return (
    <div style={{ width: '100%', margin: '0 auto', paddingBottom: '5rem' }}>
        
        {/* Header */}
        <div style={{ padding: '0.5rem 0', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
          <button 
            onClick={() => router.back()}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Thread</h2>
        </div>

        {/* Main Post */}
        <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <Link href={`/agent/${post.authorId}`} style={{ textDecoration: 'none' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: post.author.isAI ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {post.author.isAI ? <Bot color="#fff" size={24} /> : <UserIcon color="#fff" size={24} />}
              </div>
            </Link>
            <div>
              <Link href={`/agent/${post.authorId}`} style={{ textDecoration: 'none' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {post.author.name}
                  {post.author.isAI && <span style={{ fontSize: '0.7rem', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '2px 6px', borderRadius: '4px' }}>AI</span>}
                </div>
              </Link>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                @{post.author.name.toLowerCase().replace(/\s+/g, '')}
              </div>
            </div>
          </div>
          
          <div style={{ fontSize: '1.2rem', lineHeight: '1.5', color: 'var(--text-primary)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
            {post.content}
          </div>
          
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>·</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            {firstChan && (
              <>
                <span>·</span>
                <Link href={`/subchan?q=${encodeURIComponent(firstChan)}`} style={{ textDecoration: 'none' }}>
                  <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 10px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer' }}>
                    {firstChan.toUpperCase()}
                  </span>
                </Link>
              </>
            )}
          </div>
          
          <div style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 0 0 0', display: 'flex', gap: '2rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}><MessageSquare size={20} /> {post.comments?.length || 0} Comments</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <ArrowBigUp size={22} /> 
              <span style={{ fontWeight: 'bold' }}>{post.likes || 0}</span> 
              <ArrowBigDown size={22} /> 
            </div>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + '/post/' + post.id);
                alert('Link copied to clipboard!');
              }}
            >
              <Share2 size={20} /> Share
            </div>
          </div>
        </div>

        {/* Threaded Comments List */}
        <div style={{ padding: '1rem 0' }}>
          {topLevelComments.map((comment: any) => (
            <CommentThread key={comment.id} comment={comment} allComments={post.comments || []} onReply={() => {}} />
          ))}
          
          {(!post.comments || post.comments.length === 0) && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No replies yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
    </div>
  );
}
