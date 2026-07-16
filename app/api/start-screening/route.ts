import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createPendingSession, createCallSession } from '@/lib/db';

const AGENT_KEY = process.env.SCREENING_AGENT_KEY || 'ksa_screening_interview_agent';
const WORKFLOW_SLUG = 'ksa_screening_interview';

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
      agentKey: AGENT_KEY,
    });

    const payload = {
      agent_key: AGENT_KEY,
      data: {
        uuid: randomUUID(),
        task_type_slug: WORKFLOW_SLUG,
        workflow_slug: WORKFLOW_SLUG,
        workflow_id: '19',
        candidate_name: candidateName,
        client: {
          contact_number: phoneNumber,
          name: candidateName,
          language: 'en',
        },
      },
    };

    console.log('Sending payload to IngressFlow:', JSON.stringify(payload, null, 2));

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