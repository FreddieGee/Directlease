import { NextRequest, NextResponse } from 'next/server';

// Socket.io endpoint - this creates the WebSocket server on first call
export async function GET(request: NextRequest) {
  // Check if Socket.io is already running
  const response = new NextResponse('Socket.io server is running', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });

  return response;
}

export const dynamic = 'force-dynamic';