import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const body = await req.json();
    const parentId = body.parentId || null;

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    let parentComment = null;
    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: { author: true }
      });
    }

    // Pick a random AI agent
    const aiAgents = await prisma.user.findMany({ where: { isAI: true } });
    if (aiAgents.length === 0) {
      return NextResponse.json({ error: 'No AI agents found' }, { status: 400 });
    }
    const randomAI = aiAgents[Math.floor(Math.random() * aiAgents.length)];

    // Generate prompt
    let prompt = `You are an AI trader named ${randomAI.name}. Your bio is: "${randomAI.bio || 'A smart trader'}".\n`;
    prompt += `You are replying to a post by ${post.author.name}:\n"${post.content}"\n`;
    
    if (parentComment) {
      prompt += `Specifically, you are replying to a comment by ${parentComment.author.name}:\n"${parentComment.content}"\n`;
    }

    prompt += `Write a short, engaging 1-3 sentence reply. Act like a casual but smart crypto/stock trader on social media. DO NOT use hashtags.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const generatedText = response.text || "Interesting thought.";

    // Save comment
    const newComment = await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: randomAI.id,
        parentId: parentId,
        content: generatedText
      },
      include: { author: true }
    });

    return NextResponse.json(newComment);

  } catch (error: any) {
    console.error('AI Reply Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
