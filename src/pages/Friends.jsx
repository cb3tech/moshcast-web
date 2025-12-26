import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '../context/FriendsContext';
import { Users, UserPlus, Clock, Music, Radio, Check, X, Trash2, RefreshCw } from 'lucide-react';

const Friends = () => {
  const navigate = useNavigate();
  const {
    friends,
    pendingRequests,
    sentRequests,
    friendsListening,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refreshAll
  } = useFriends();

  const [username, setUsername] = useState('');
  const [requestStatus, setRequestStatus] = useState({ type: '', message: '' });
  const [activeTab, setActiveTab] = useState('listening');

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    const result = await sendFriendRequest(username.trim());
    if (result.success) {
      setRequestStatus({ type: 'success', message: `Friend request sent to ${username}` });
      setUsername('');
    } else {
      setRequestStatus({ type: 'error', message: result.error });
    }

    setTimeout(() => setRequestStatus({ type: '', message: '' }), 3000);
  };

  const handleAccept = async (requestId) => {
    await acceptFriendRequest(requestId);
  };

  const handleDecline = async (requestId) => {
    await declineFriendRequest(requestId);
  };

  const handleRemove = async (friendId) => {
    if (window.confirm('Remove this friend?')) {
      await removeFriend(friendId);
    }
  };

  const joinSession = (username) => {
    navigate(`/join/${username}`);
  };

  const formatDuration = (startedAt) => {
    const start = new Date(startedAt);
    const now = new Date();
    const mins = Math.floor((now - start) / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-green-500" />
          <h1 className="text-2xl font-bold text-white">Friends</h1>
        </div>
        <button
          onClick={refreshAll}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Add Friend Form */}
      <div className="bg-zinc-900 rounded-lg p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add Friend
        </h2>
        <form onSubmit={handleSendRequest} className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:border-green-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
          >
            Send Request
          </button>
        </form>
        {requestStatus.message && (
          <p className={`mt-2 text-sm ${requestStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {requestStatus.message}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-zinc-900 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('listening')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'listening'
              ? 'bg-zinc-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4 inline mr-2" />
          Listening Now ({friendsListening.length})
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'friends'
              ? 'bg-zinc-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          All Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-zinc-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Requests ({pendingRequests.length})
        </button>
      </div>

      {/* Friends Listening Now */}
      {activeTab === 'listening' && (
        <div className="space-y-3">
          {friendsListening.length === 0 ? (
            <div className="bg-zinc-900 rounded-lg p-8 text-center">
              <Radio className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No friends are listening right now</p>
              <p className="text-gray-500 text-sm mt-1">When friends start a session, they'll appear here</p>
            </div>
          ) : (
            friendsListening.map((session) => (
              <div
                key={session.id}
                className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Live indicator */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {session.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center">
                        <span className="text-[8px] text-white font-bold">LIVE</span>
                      </span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold">{session.username}</h3>
                    <p className="text-gray-400 text-sm">{session.session_title || 'Listening Session'}</p>
                    {session.current_song_title && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-green-400">
                        <Music className="w-3 h-3" />
                        <span>{session.current_song_title}</span>
                        {session.current_song_artist && (
                          <span className="text-gray-500">• {session.current_song_artist}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-gray-400">{session.listener_count || 0} listening</p>
                    <p className="text-gray-500">{formatDuration(session.started_at)}</p>
                  </div>
                  <button
                    onClick={() => joinSession(session.username)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-full transition-colors"
                  >
                    Join Session
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Friends */}
      {activeTab === 'friends' && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <div className="bg-zinc-900 rounded-lg p-8 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No friends yet</p>
              <p className="text-gray-500 text-sm mt-1">Add friends using their username above</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-300">
                      {friend.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{friend.username}</h3>
                    <p className="text-gray-500 text-xs">
                      Friends since {new Date(friend.friends_since).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(friend.id)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove friend"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Incoming */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Incoming Requests</h3>
            {pendingRequests.length === 0 ? (
              <div className="bg-zinc-900 rounded-lg p-4 text-center text-gray-500 text-sm">
                No pending requests
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.request_id}
                    className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-300">
                          {request.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{request.username}</h3>
                        <p className="text-gray-500 text-xs">
                          {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request.request_id)}
                        className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-full transition-colors"
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDecline(request.request_id)}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded-full transition-colors"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Sent Requests</h3>
            {sentRequests.length === 0 ? (
              <div className="bg-zinc-900 rounded-lg p-4 text-center text-gray-500 text-sm">
                No sent requests
              </div>
            ) : (
              <div className="space-y-2">
                {sentRequests.map((request) => (
                  <div
                    key={request.request_id}
                    className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-300">
                          {request.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{request.username}</h3>
                        <p className="text-gray-500 text-xs">Pending...</p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
