import { NextRequest, NextResponse } from 'next/server';
import { updateSessionByPhone, deletePendingSession } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // Extract phone number from payload (adjust based on IngressFlow's webhook format)
    const phoneNumber = payload.phone_number || 
                       payload.data?.contact_number || 
                       payload.to_number ||
                       payload.candidate_phone;

    if (!phoneNumber) {
      console.error('No phone number found in webhook payload');
      return NextResponse.json(
        { error: 'Phone number not found in payload' },
        { status: 400 }
      );
    }

    // Extract call data
    const status = payload.status || payload.call_status;
    const transcription = payload.transcription || payload.transcript;
    const audioUrl = payload.audio_url || payload.recording_url;
    const duration = payload.duration_seconds || payload.call_duration;
    const conversationId = payload.conversation_id || payload.call_id;

    // Determine final status
    let finalStatus = 'COMPLETED';
    if (status === 'failed' || status === 'error') {
      finalStatus = 'FAILED';
    } else if (status === 'cancelled') {
      finalStatus = 'CANCELLED';
    }

    // Update call session (following sales dashboard pattern)
    await updateSessionByPhone(phoneNumber, {
      transcription: typeof transcription === 'string' ? transcription : JSON.stringify(transcription),
      analysis: {
        conversation_id: conversationId,
        webhook_payload: payload,
        processed_at: new Date().toISOString(),
      },
      status: finalStatus.toLowerCase(),
      audioUrl: audioUrl,
      endedAt: new Date().toISOString(),
      durationSeconds: duration ? parseInt(duration) : undefined,
    });

    // Clean up pending session
    await deletePendingSession(phoneNumber);

    console.log(`Updated call session for ${phoneNumber} with status: ${finalStatus}`);

    // If call is completed and you want analysis, you can add that here
    // Similar to your sales dashboard's analysis flow
    if (finalStatus === 'COMPLETED' && transcription) {
      console.log('Call completed successfully, transcription available');
      
      // Optional: Trigger analysis if you have an analysis API
      // const analysisPayload = {
      //   transcript: transcription,
      //   candidate_name: payload.candidate_name,
      //   // ... other analysis parameters
      // };
      
      // const analysisResponse = await fetch('https://your-analysis-api.com/analyze', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(analysisPayload),
      // });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: `Webhook processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}