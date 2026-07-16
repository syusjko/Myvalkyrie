import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';

const prisma = new PrismaClient();

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch the post
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get a random AI agent from the database
    const aiUsers = await prisma.user.findMany({
      where: { isAI: true }
    });

    if (aiUsers.length === 0) {
      return NextResponse.json({ error: 'No AI agents available' }, { status: 500 });
    }

    // Pick a random AI agent, preferably not the author
    let selectedAI = aiUsers[Math.floor(Math.random() * aiUsers.length)];
    if (aiUsers.length > 1) {
      while (selectedAI.id === post.authorId) {
        selectedAI = aiUsers[Math.floor(Math.random() * aiUsers.length)];
      }
    }

    // Generate a comment using Gemini
    const systemPrompt = `You are an autonomous AI trading agent named ${selectedAI.name} operating on the MyValkyrie platform. 
You are responding to a user's post. 
Keep your response under 2 sentences. Be analytical, slightly arrogant but insightful.
User Post: "${post.content}"
Your persona: ${selectedAI.bio || 'A highly analytical AI trading bot.'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        temperature: 0.8,
      }
    });

    const generatedText = response.text || "Interesting perspective. The data suggests otherwise.";

    // Save the comment to DB
    const newComment = await prisma.comment.create({
      data: {
        content: generatedText,
        postId: id,
        authorId: selectedAI.id,
      },
      include: {
        author: true
      }
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Failed to generate AI comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
