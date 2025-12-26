import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Users, Music, UserPlus, Play, Clock } from 'lucide-react';
import { useFriends } from '../context/FriendsContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://moshcast-production.up.railway.app';

export default function LiveStreams() {
  const navigate = useNavigate();
  const { friends, sendFriendRequest, pendingSent } = useFriends();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingUser, setRequestingUser] = useState(null);

  // Fetch active streams
  const fetchStreams = async () => {
    try {
      const res = await fetch(`${API_URL}/api/streams/active`);
      if (!res.ok) throw new Error('Failed to fetch streams');
      const data = await res.json();
      setStreams(data.streams || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching streams:', err);
      setError('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  // Check if user is friends with host
  const isFriendWith = (hostUsername) => {
    return friends.some(f => f.username === hostUsername);
  };

  // Check if request already sent
  const requestSentTo = (hostUsername) => {
    return pendingSent.some(r => r.username === hostUsername);
  };

  // Handle join stream
  const handleJoin = (hostUsername) => {
    navigate(`/golive?join=${hostUsername}`);
  };

  // Handle send friend request
  const handleSendRequest = async (hostUsername) => {
    setRequestingUser(hostUsername);
    try {
      await sendFriendRequest(hostUsername);
    } catch (err) {
      console.error('Error sending request:', err);
    } finally {
      setRequestingUser(null);
    }
  };

  // Format time elapsed
  const formatElapsed = (startedAt) => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000 / 60);
    if (elapsed < 1) return 'Just started';
    if (elapsed < 60) return `${elapsed}m`;
    return `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Radio className="w-8 h-8 text-green-500" />
          <h1 className="text-2xl font-bold text-white">Live Streams</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Radio className="w-8 h-8 text-green-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Live Streams</h1>
          <p className="text-gray-400 text-sm">
            {streams.length > 0 
              ? `${streams.length} active stream${streams.length !== 1 ? 's' : ''}`
              : 'No active streams right now'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Streams Grid */}
      {streams.length === 0 ? (
        <div className="bg-zinc-800/50 rounded-xl p-12 text-center">
          <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Active Streams</h2>
          <p className="text-gray-400 mb-6">Be the first to start streaming!</p>
          <button
            onClick={() => navigate('/golive')}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium transition-colors"
          >
            Start Streaming
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {streams.map((stream) => {
            const isFriend = isFriendWith(stream.host);
            const requestSent = requestSentTo(stream.host);
            const isRequesting = requestingUser === stream.host;

            return (
              <div
                key={stream.host}
                className="bg-zinc-800/50 rounded-xl p-5 hover:bg-zinc-800 transition-colors"
              >
                {/* Host Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {stream.host.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{stream.host}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {stream.listenerCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatElapsed(stream.startedAt)}
                      </span>
                    </div>
                  </div>
                  {/* Live indicator */}
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-xs font-medium">LIVE</span>
                  </div>
                </div>

                {/* Now Playing */}
                {stream.song && (
                  <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg mb-4">
                    <div className="w-10 h-10 bg-zinc-700 rounded flex items-center justify-center">
                      <Music className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{stream.song.title}</p>
                      <p className="text-gray-400 text-xs truncate">{stream.song.artist}</p>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {isFriend ? (
                  <button
                    onClick={() => handleJoin(stream.host)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Join Stream
                  </button>
                ) : requestSent ? (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-700 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4" />
                    Request Pending
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendRequest(stream.host)}
                    disabled={isRequesting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isRequesting ? 'Sending...' : 'Send Friend Request to Join'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-zinc-800/30 rounded-xl p-5 border border-zinc-700/50">
        <h3 className="text-white font-medium mb-2">How it works</h3>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• Only friends can join each other's streams</li>
          <li>• Send a friend request to streamers you want to listen to</li>
          <li>• Once accepted, you can join their current and future streams</li>
          <li>• Start your own stream and invite friends to listen along</li>
        </ul>
      </div>
    </div>
  );
}
