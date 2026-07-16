"use client";

import Link from "next/link";
import { getCallHistory, type CallRow } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { BASE_PATH } from "@/lib/basePath";

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'failed': 'bg-red-100 text-red-800 border-red-200',
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColors[status] || statusColors['failed']}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDuration(seconds?: number) {
  if (!seconds) return '—';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

type PaginationData = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
};

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 20
  });

  const fetchCalls = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      const response = await fetch(`${BASE_PATH}/api/calls?${params}`);
      const data = await response.json();
      
      setCalls(data.calls);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchCalls(newPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading call history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ color: '#1f2937 !important' }}>
              Screening Call History
            </h1>
            <p className="mt-2 text-lg text-gray-600" style={{ color: '#4b5563 !important' }}>
              View all completed and ongoing screening interviews
            </p>
          </div>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            style={{ color: 'white !important' }}
          >
            ← Start New Call
          </Link>
        </div>

        {/* Stats and Search Results Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{pagination.totalCount}</div>
            <div className="text-sm text-gray-600">Total Calls</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {calls.filter(c => c.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed (Page)</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {calls.filter(c => c.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress (Page)</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-600">
              {Math.round(calls.filter(c => c.duration_seconds).reduce((acc, call) => acc + (call.duration_seconds || 0), 0) / calls.filter(c => c.duration_seconds).length) || 0}s
            </div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </div>
        </div>
        
        {/* Pagination Info */}
        {!loading && (
          <div className="mb-6 text-sm text-gray-600">
            Showing {calls.length} of {pagination.totalCount} calls
            {pagination.totalPages > 1 && (
              <span> • Page {pagination.currentPage} of {pagination.totalPages}</span>
            )}
          </div>
        )}

        {/* Call History Table */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {calls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calls.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {call.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{call.candidate_phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={call.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <CallDetailsModal call={call} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">No screening calls yet</div>
              <Link 
                href="/" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Start Your First Call
              </Link>
            </div>
          )}
          
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: '#374151 !important' }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: '#374151 !important' }}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: '#6b7280 !important' }}
                      >
                        ← Previous
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNumber;
                        if (pagination.totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNumber = pagination.totalPages - 4 + i;
                        } else {
                          pageNumber = pagination.currentPage - 2 + i;
                        }
                        
                        const isCurrent = pageNumber === pagination.currentPage;
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              isCurrent
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                            style={{ color: isCurrent ? '#2563eb !important' : '#6b7280 !important' }}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: '#6b7280 !important' }}
                      >
                        Next →
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CallDetailsModal({ call }: { call: CallRow }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors font-medium"
        style={{ color: '#2563eb !important', textDecoration: 'none' }}
      >
        View Details
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="p-6 w-full min-w-0">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900" style={{ color: '#1f2937 !important' }}>
                  Call Details - {call.name}
                </h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                  style={{ color: '#6b7280 !important' }}
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="text-sm text-gray-900">{call.candidate_phone}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1"><StatusBadge status={call.status} /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <div className="text-sm text-gray-900">{formatDuration(call.duration_seconds)}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Started At</label>
                  <div className="text-sm text-gray-900">
                    {call.started_at ? new Date(call.started_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ended At</label>
                  <div className="text-sm text-gray-900">
                    {call.ended_at ? new Date(call.ended_at).toLocaleString() : '—'}
                  </div>
                </div>
                  {call.audio_url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Recording</label>
                      <audio controls className="mt-1 w-full">
                        <source src={call.audio_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              </div>

              {call.transcription && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowTranscription((prev) => !prev)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 cursor-pointer hover:text-gray-900"
                    style={{ color: '#374151 !important' }}
                  >
                    <span className={`inline-block transition-transform ${showTranscription ? 'rotate-90' : ''}`}>▶</span>
                    Transcription
                  </button>
                  {showTranscription && (
                    <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                        {typeof call.transcription === 'string'
                          ? call.transcription
                          : JSON.stringify(call.transcription, null, 2)
                        }
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {call.analysis && (
                <div className="mb-6 w-full min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Score Card</label>
                  <ScoreCard analysis={call.analysis} />
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  style={{ color: '#374151 !important' }}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const SCORE_LABELS: Record<string, string> = {
  role_fit: 'Role Fit',
  red_flags: 'Red Flags',
  motivation: 'Motivation',
  coachability: 'Coachability',
  company_research: 'Company Research',
  discovery_instinct: 'Discovery Instinct',
  objection_handling: 'Objection Handling',
  structured_thinking: 'Structured Thinking',
  phone_presence_energy: 'Phone Presence & Energy',
  quota_numbers_literacy: 'Quota/Numbers Literacy',
  listening_question_asking: 'Listening & Question-Asking',
};

const DECISION_COLORS: Record<string, string> = {
  advance: 'bg-green-100 text-green-800 border-green-200',
  reject: 'bg-red-100 text-red-800 border-red-200',
  hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

function ScoreCard({ analysis }: { analysis: any }) {
  const normalizedAnalysis =
    analysis?.scores || analysis?.decision || analysis?.final_score !== undefined
      ? analysis
      : analysis?.response?.analysis ?? analysis?.analysis ?? analysis;

  const scores: Record<string, number> | undefined = normalizedAnalysis?.scores;
  const decision: string | undefined = normalizedAnalysis?.decision;
  const finalScore: number | undefined = normalizedAnalysis?.final_score;
  const decisionLogic: string | undefined = normalizedAnalysis?.decision_logic;
  const candidateSummary: string | undefined = normalizedAnalysis?.candidate_summary;
  const missingInformation: string[] | undefined = normalizedAnalysis?.missing_information;

  // Fallback for older records that don't match the scorecard shape
  if (!scores && !decision && finalScore === undefined) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
        <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 w-full min-w-0">
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Final Score</div>
          <div className="text-3xl font-bold text-gray-900">{finalScore ?? '—'}</div>
        </div>
        {decision && (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border capitalize ${
              DECISION_COLORS[decision] || 'bg-gray-100 text-gray-800 border-gray-200'
            }`}
          >
            {decision}
          </span>
        )}
      </div>

      {scores && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          {Object.entries(scores).map(([key, value]) => (
            <div key={key} className="bg-white border border-gray-200 rounded-lg p-3 w-full min-w-0">
              <div className="text-xs text-gray-500 break-words">{SCORE_LABELS[key] || key}</div>
              <div className="text-lg font-semibold text-gray-900">
                {value}
                <span className="text-xs text-gray-400">/5</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {candidateSummary && (
        <div className="w-full min-w-0">
          <div className="text-sm font-medium text-gray-700 mb-1">Candidate Summary</div>
          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 break-words whitespace-normal leading-relaxed">
            {candidateSummary}
          </p>
        </div>
      )}

      {decisionLogic && (
        <div className="w-full min-w-0">
          <div className="text-sm font-medium text-gray-700 mb-1">Decision Logic</div>
          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 break-words whitespace-normal leading-relaxed">
            {decisionLogic}
          </p>
        </div>
      )}

      {missingInformation && missingInformation.length > 0 && (
        <div className="w-full min-w-0">
          <div className="text-sm font-medium text-gray-700 mb-1">Missing Information</div>
          <ul className="list-disc list-inside text-sm text-gray-900 bg-gray-50 rounded-lg p-3 break-words whitespace-normal">
            {missingInformation.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}