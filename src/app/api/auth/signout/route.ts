import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST() {
  const session = await auth();
  if (session) {
    await auth().signOut();
  }
  return NextResponse.json({ success: true });
}
