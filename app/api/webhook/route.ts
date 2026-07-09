import { NextRequest, NextResponse } from 'next/server';
import { updateSessionByPhone, deletePendingSession } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('Echo webhook received:', JSON.stringify(payload, null, 2));

    // Extract phone number from Echo's webhook payload
    // Based on your Echo DB data: clientContactNumber in dynamic_variables
    const phoneNumber = payload.phone_number || 
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
    const audioUrl = payload.audio_url;
    const duration = payload.duration_seconds || payload.call_duration;
    
    // Extract transcription - Echo sends it in transcript field
    let transcription = null;
    if (payload.transcript) {
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

    // Extract analysis data from Echo's metadata
    const analysis = {
      conversation_id: conversationId,
      echo_metadata: payload.metadata || {},
      analysis: payload.analysis || {},
      transcript_summary: payload.analysis?.transcript_summary || null,
      call_successful: payload.analysis?.call_successful || null,
      processed_at: new Date().toISOString(),
    };

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