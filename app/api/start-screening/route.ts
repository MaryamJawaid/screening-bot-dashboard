import { NextRequest, NextResponse } from 'next/server';
import { createPendingSession, createCallSession } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, candidateName } = body;

    // Validation
    if (!phoneNumber || !candidateName) {
      return NextResponse.json(
        { error: 'Phone number and candidate name are required' },
        { status: 400 }
      );
    }

    // Create pending session for tracking
    await createPendingSession({
      phoneNumber,
      candidateName,
      agentKey: 'ksa_screening_interview_agent',
    });

    // Prepare payload for IngressFlow (exact schema match)
    const payload = {
      agent_key: 'ksa_screening_interview_agent', // Must match enum exactly
      data: {
        workflow_slug: 'ksa_screening_interview',
        workflow_id: 3,
        candidate_name: candidateName,
        contact_number: phoneNumber,
      },
    };

    console.log('Sending payload to IngressFlow:', JSON.stringify(payload, null, 2));

    // Call IngressFlow API using environment variable
    const ingressFlowUrl = process.env.INGRESSFLOW_WEBHOOK_URL || 'https://echo.ingressflow.com/external/workflow/invoke';
    const response = await fetch(ingressFlowUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.INVOKE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IngressFlow API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to start screening call: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('IngressFlow response:', result);

    // Create call session in separate screening database
    const callSession = await createCallSession({
      phoneNumber,
      candidateName,
      conversationId: result.conversation_id || result.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Screening call initiated successfully',
      sessionId: callSession.id,
      ingressFlowResponse: result,
    });

  } catch (error: any) {
    console.error('Error starting screening call:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}