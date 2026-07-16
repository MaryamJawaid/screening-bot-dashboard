import { NextRequest, NextResponse } from 'next/server';
import { updateSessionByPhone, deletePendingSession } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('Echo webhook received:', JSON.stringify(payload, null, 2));

    // Echo wraps call data in request.request_payload.call_metadata
    const requestPayload = payload.request?.request_payload;
    const callMetadata = requestPayload?.call_metadata;

    // Extract phone number from Echo's webhook payload
    const phoneNumber = callMetadata?.phone_number ||
                       payload.phone_number ||
                       payload.data?.clientContactNumber ||
                       payload.clientContactNumber ||
                       payload.dynamic_variables?.clientContactNumber ||
                       payload.to_number ||
                       payload.candidate_phone;

    if (!phoneNumber) {
      console.error('No phone number found in Echo webhook payload');
      console.log('Available fields:', Object.keys(payload));
      return NextResponse.json(
        { error: 'Phone number not found in payload' },
        { status: 400 }
      );
    }

    // Extract call data from Echo webhook format
    const status = payload.status || payload.call_status || 'completed';
    const conversationId = payload.conversation_id;
    const audioUrl = callMetadata?.audio_url || payload.audio_url;
    const duration = callMetadata?.call_duration ?? payload.duration_seconds ?? payload.call_duration;

    // Extract transcription - Echo sends it as a plain string in call_metadata.call_transcription,
    // but keep the older `transcript` shapes as a fallback
    let transcription = null;
    if (callMetadata?.call_transcription) {
      transcription = callMetadata.call_transcription;
    } else if (payload.transcript) {
      if (Array.isArray(payload.transcript)) {
        // If transcript is array of messages, combine them
        transcription = payload.transcript
          .map((t: any) => `${t.role}: ${t.message}`)
          .join('\n');
      } else if (typeof payload.transcript === 'string') {
        transcription = payload.transcript;
      } else {
        transcription = JSON.stringify(payload.transcript);
      }
    }

    // Map Echo status to our status
    let finalStatus = 'completed';
    if (status === 'answered' || status === 'completed' || status === 'done') {
      finalStatus = 'completed';
    } else if (status === 'failed' || status === 'unanswered' || status === 'error') {
      finalStatus = 'failed';  
    } else if (status === 'cancelled') {
      finalStatus = 'cancelled';
    }

    console.log(`Processing Echo webhook for ${phoneNumber}, status: ${status} -> ${finalStatus}`);

    // Send transcript to Ingress for the screening scorecard
    let analysis = null;
    if (transcription) {
      try {
        const analysePayload = {
          request: {
            request_type: 'screening-bot-post-analysis',
            request_payload: {
              text: transcription,
            },
          },
        };

        const analyseResponse = await fetch('https://propforce-bayut-sa.ingressflow.com/external/requests/analyse', {
          method: 'POST',
          headers: {
            'auth-token': process.env.ANALYSE_AUTH_TOKEN ?? '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analysePayload),
        });

        const analyseResult = await analyseResponse.json();
        console.log('Ingress post-analysis response:', JSON.stringify(analyseResult, null, 2));
        analysis = analyseResult?.response?.analysis ?? null;
      } catch (err) {
        console.error('Ingress post-analysis call failed:', err);
      }
    }

    // Update call session in Neon database
    await updateSessionByPhone(phoneNumber, {
      transcription: transcription,
      analysis: analysis,
      status: finalStatus,
      audioUrl: audioUrl,
      endedAt: new Date().toISOString(),
      durationSeconds: duration ? parseInt(duration.toString()) : undefined,
    });

    // Clean up pending session
    await deletePendingSession(phoneNumber);

    console.log(`✅ Updated Neon call session for ${phoneNumber} with status: ${finalStatus}`);

    if (finalStatus === 'completed' && transcription) {
      console.log('📞 Call completed successfully with transcription');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Echo webhook processed successfully',
      phone_number: phoneNumber,
      status: finalStatus,
      conversation_id: conversationId
    });

  } catch (error: any) {
    console.error('❌ Echo webhook processing error:', error);
    return NextResponse.json(
      { error: `Webhook processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}