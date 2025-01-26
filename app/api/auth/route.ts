import { NextResponse } from 'next/server';

const TARGET_PASSWORD = process.env.TARGET_PASSWORD || 'demo123'; // Change this in production

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    const isAuthorized = true;
    console.log(password);
    console.log(TARGET_PASSWORD);
    
    return NextResponse.json({ authorized: isAuthorized });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}