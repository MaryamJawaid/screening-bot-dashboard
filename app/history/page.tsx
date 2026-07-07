import Link from "next/link";
import { getCallHistory, type CallRow } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

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

export default async function CallHistoryPage() {
  const calls = await getCallHistory(100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Screening Call History
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              View all completed and ongoing screening interviews
            </p>
          </div>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            ← Start New Call
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{calls.length}</div>
            <div className="text-sm text-gray-600">Total Calls</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {calls.filter(c => c.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {calls.filter(c => c.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-600">
              {calls.filter(c => c.duration_seconds).reduce((acc, call) => acc + (call.duration_seconds || 0), 0) / calls.filter(c => c.duration_seconds).length || 0}s
            </div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </div>
        </div>

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
        </div>
      </div>
    </div>
  );
}

function CallDetailsModal({ call }: { call: CallRow }) {
  return (
    <details className="group">
      <summary className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors">
        View Details
      </summary>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 group-open:block hidden">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Call Details - {call.name}
                </h2>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    const target = e.target as HTMLElement;
                    const details = target.closest('details') as HTMLDetailsElement;
                    if (details) details.open = false;
                  }}
                  className="text-gray-400 hover:text-gray-600"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transcription</label>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {typeof call.transcription === 'string' 
                        ? call.transcription 
                        : JSON.stringify(call.transcription, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}

              {call.analysis && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Analysis</label>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-600">
                      {JSON.stringify(call.analysis, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}