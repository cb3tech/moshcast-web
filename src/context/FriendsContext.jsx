import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const FriendsContext = createContext();

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

export const FriendsProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friendsListening, setFriendsListening] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://moshcast-production.up.railway.app';

  const fetchFriends = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/api/friends`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFriends(data.friends || []);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  }, [token, API_URL]);

  const fetchPendingRequests = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/api/friends/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPendingRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    }
  }, [token, API_URL]);

  const fetchSentRequests = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/api/friends/sent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSentRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch sent requests:', err);
    }
  }, [token, API_URL]);

  const fetchFriendsListening = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/api/friends/listening`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFriendsListening(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch friends listening:', err);
    }
  }, [token, API_URL]);

  const sendFriendRequest = async (username) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    
    try {
      const res = await fetch(`${API_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      
      if (res.ok) {
        await fetchSentRequests();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to send request' };
    }
  };

  const acceptFriendRequest = async (requestId) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    
    try {
      const res = await fetch(`${API_URL}/api/friends/accept/${requestId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        await fetchFriends();
        await fetchPendingRequests();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to accept request' };
    }
  };

  const declineFriendRequest = async (requestId) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    
    try {
      const res = await fetch(`${API_URL}/api/friends/decline/${requestId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        await fetchPendingRequests();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to decline request' };
    }
  };

  const removeFriend = async (friendId) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    
    try {
      const res = await fetch(`${API_URL}/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        await fetchFriends();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to remove friend' };
    }
  };

  const startSession = async (title, songTitle, songArtist) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    
    try {
      const res = await fetch(`${API_URL}/api/friends/session/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, songTitle, songArtist })
      });
      const data = await res.json();
      
      if (res.ok) {
        return { success: true, sessionId: data.session_id };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to start session' };
    }
  };

  const updateSession = async (songTitle, songArtist, listenerCount) => {
    if (!token) return;
    
    try {
      await fetch(`${API_URL}/api/friends/session/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ songTitle, songArtist, listenerCount })
      });
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  const endSession = async () => {
    if (!token) return;
    
    try {
      await fetch(`${API_URL}/api/friends/session/end`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchFriends(),
        fetchPendingRequests(),
        fetchSentRequests(),
        fetchFriendsListening()
      ]);
    } catch (err) {
      setError('Failed to load friends data');
    } finally {
      setLoading(false);
    }
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests, fetchFriendsListening]);

  // Initial fetch when token available
  useEffect(() => {
    if (token) {
      refreshAll();
    }
  }, [token, refreshAll]);

  // Poll for friends listening every 30 seconds
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      fetchFriendsListening();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [token, fetchFriendsListening]);

  const value = {
    friends,
    pendingRequests,
    sentRequests,
    friendsListening,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    startSession,
    updateSession,
    endSession,
    refreshAll,
    fetchFriendsListening
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
};

export default FriendsContext;
