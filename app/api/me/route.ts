/** @format */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  // Expecting session?.user to include the full API user payload mapped during signIn callback
  // Fallback to null if not authenticated
  const user = session?.user ?? null;
  return NextResponse.json({ user });
}
