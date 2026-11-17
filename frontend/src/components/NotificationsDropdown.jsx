import { useEffect, useState, useMemo, useCallback } from 'react';
import { Badge, Dropdown, Button, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { getCurrentUserId, KNOWN_USERS } from '../utils/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getRealSenderName = (senderId, rawName) => {
  if (rawName && !rawName.startsWith('MMC-') && !rawName.toLowerCase().startsWith('provider')) {
    return rawName;
  }
  if (senderId && KNOWN_USERS[senderId]) {
    return `${KNOWN_USERS[senderId].first_name} ${KNOWN_USERS[senderId].last_name}`.trim();
  }
  return senderId || 'User';
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

function NotificationsDropdown({ currentUser }) {
  const navigate = useNavigate();
  const activeUserId = (currentUser && currentUser.user_id) || getCurrentUserId();

  const [currentUserId, setCurrentUserId] = useState(activeUserId);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`serbisyou_read_notifs_${activeUserId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Sync with prop changes
  useEffect(() => {
    if (currentUser && currentUser.user_id && currentUser.user_id !== currentUserId) {
      setCurrentUserId(currentUser.user_id);
    }
  }, [currentUser, currentUserId]);

  // Load persistent read IDs whenever user changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`serbisyou_read_notifs_${currentUserId}`);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      } else {
        setReadIds(new Set());
      }
    } catch {
      setReadIds(new Set());
    }
  }, [currentUserId]);

  // Fetch real notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'x-user-id': String(currentUserId) },
      });

      let serverNotifs = [];
      if (response.ok) {
        const data = await response.json();
        serverNotifs = Array.isArray(data?.notifications) ? data.notifications : [];
      }

      // Merge with custom persistent local booking notifications
      let localNotifs = [];
      try {
        const storedLocal = localStorage.getItem(`serbisyou_custom_notifs_${currentUserId}`);
        if (storedLocal) {
          localNotifs = JSON.parse(storedLocal);
        }
      } catch {
        // ignore
      }

      const mergedMap = new Map();
      [...serverNotifs, ...localNotifs].forEach((notif) => {
        mergedMap.set(notif.id, notif);
      });

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(mergedList);
    } catch (err) {
      console.error('Error loading real notifications:', err);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time notification listeners (Socket.io + user change + booking events)
  useEffect(() => {
    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    const registerSocket = () => {
      socket.emit('register', currentUserId);
    };

    registerSocket();
    socket.on('connect', registerSocket);

    const handleReceiveMessage = (newMessage) => {
      if (!newMessage) return;
      const senderId = newMessage.sender_id ?? newMessage.senderId ?? newMessage.from;
      if (senderId && String(senderId) === String(currentUserId)) {
        return; // Don't notify self
      }

      const senderName = getRealSenderName(
        senderId,
        newMessage.sender_name ?? newMessage.senderName
      );

      const notif = {
        id: `msg_${newMessage.message_id || Date.now()}`,
        type: 'message',
        title: `New message from ${senderName}`,
        description: newMessage.content || newMessage.message || 'Sent you a message',
        timestamp: newMessage.timestamp || new Date().toISOString(),
        read: false,
        link: `/messages/${senderId}`,
        target_id: senderId,
      };

      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== notif.id);
        return [notif, ...filtered];
      });
    };

    const handleNewNotification = (notif) => {
      if (!notif) return;
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== notif.id);
        return [notif, ...filtered];
      });
    };

    const handleCustomBookingNotif = (event) => {
      if (!event.detail) return;
      const bookingNotif = event.detail;

      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== bookingNotif.id);
        const updated = [bookingNotif, ...filtered];

        // Persist local booking notification
        try {
          const stored = localStorage.getItem(`serbisyou_custom_notifs_${currentUserId}`);
          const parsed = stored ? JSON.parse(stored) : [];
          const updatedCustom = [bookingNotif, ...parsed.filter((n) => n.id !== bookingNotif.id)].slice(0, 20);
          localStorage.setItem(`serbisyou_custom_notifs_${currentUserId}`, JSON.stringify(updatedCustom));
        } catch {
          // ignore
        }

        return updated;
      });
    };

    const handleUserChanged = (event) => {
      const newUid = event.detail?.userId || getCurrentUserId();
      setCurrentUserId(newUid);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('new_notification', handleNewNotification);
    window.addEventListener('serbisyou_notification', handleCustomBookingNotif);
    window.addEventListener('serbisyou_user_changed', handleUserChanged);

    return () => {
      socket.off('connect', registerSocket);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('new_notification', handleNewNotification);
      window.removeEventListener('serbisyou_notification', handleCustomBookingNotif);
      window.removeEventListener('serbisyou_user_changed', handleUserChanged);
    };
  }, [currentUserId]);

  // Check if a notification is read (either marked in DB or in persistent readIds)
  const isNotificationRead = useCallback((notif) => {
    return Boolean(notif.read || readIds.has(notif.id));
  }, [readIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !isNotificationRead(n)).length;
  }, [notifications, isNotificationRead]);

  const markAsRead = async (notification) => {
    const notifId = notification.id;
    const newReadIds = new Set(readIds);
    newReadIds.add(notifId);
    setReadIds(newReadIds);

    // Persist to localStorage
    try {
      localStorage.setItem(
        `serbisyou_read_notifs_${currentUserId}`,
        JSON.stringify(Array.from(newReadIds))
      );
    } catch {
      // ignore
    }

    // Update custom local notifications if any
    try {
      const stored = localStorage.getItem(`serbisyou_custom_notifs_${currentUserId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((n) => (n.id === notifId ? { ...n, read: true } : n));
        localStorage.setItem(`serbisyou_custom_notifs_${currentUserId}`, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );

    // Call backend API to persist
    fetch(`${API_URL}/api/notifications/read/${notifId}`, {
      method: 'PUT',
      headers: { 'x-user-id': String(currentUserId) },
    }).catch(() => {});

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllAsRead = async () => {
    const allIds = notifications.map((n) => n.id);
    const newReadIds = new Set([...readIds, ...allIds]);
    setReadIds(newReadIds);

    // Persist to localStorage
    try {
      localStorage.setItem(
        `serbisyou_read_notifs_${currentUserId}`,
        JSON.stringify(Array.from(newReadIds))
      );
    } catch {
      // ignore
    }

    // Mark custom local notifications as read
    try {
      const stored = localStorage.getItem(`serbisyou_custom_notifs_${currentUserId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((n) => ({ ...n, read: true }));
        localStorage.setItem(`serbisyou_custom_notifs_${currentUserId}`, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    // Persist to backend database (Supabase is_read: true)
    fetch(`${API_URL}/api/notifications/read-all`, {
      method: 'PUT',
      headers: { 'x-user-id': String(currentUserId) },
    }).catch((err) => console.error('Failed to mark all as read on backend:', err));
  };

  return (
    <Dropdown as={Nav.Item} align="end" className="notifications-nav-dropdown">
      <Dropdown.Toggle
        as={Nav.Link}
        className="text-white position-relative p-2 border-0 bg-transparent shadow-none d-flex align-items-center"
        id="notifications-dropdown-toggle"
        aria-label="Notifications"
        style={{ cursor: 'pointer' }}
      >
        <span className="position-relative d-inline-block">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 16 16"
            role="img"
            aria-label="Notifications Bell"
          >
            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
          </svg>
          {unreadCount > 0 && (
            <Badge
              pill
              bg="danger"
              className="position-absolute top-0 start-100 translate-middle"
              style={{ fontSize: '0.65rem' }}
            >
              {unreadCount}
            </Badge>
          )}
        </span>
      </Dropdown.Toggle>

      <Dropdown.Menu
        className="shadow-lg border-0 py-0 overflow-hidden"
        style={{ minWidth: '320px', maxWidth: '380px', borderRadius: '12px' }}
      >
        <Dropdown.Header className="d-flex justify-content-between align-items-center px-3 py-2 bg-light border-bottom">
          <span className="fw-bold text-dark fs-6">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none small text-primary fw-semibold"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Dropdown.Header>

        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Dropdown.ItemText className="text-muted text-center py-4">
              No notifications yet
            </Dropdown.ItemText>
          ) : (
            notifications.slice(0, 15).map((notification) => {
              const isRead = isNotificationRead(notification);

              return (
                <Dropdown.Item
                  key={notification.id}
                  onClick={() => markAsRead(notification)}
                  className={`px-3 py-2 text-wrap border-bottom border-light ${
                    isRead ? 'text-muted' : 'fw-semibold bg-primary-subtle bg-opacity-10'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between gap-1">
                        <span
                          className={`text-truncate ${
                            isRead ? 'text-secondary fw-normal' : 'text-dark fw-bold'
                          }`}
                        >
                          {notification.title}
                        </span>
                        {!isRead && (
                          <Badge bg="primary" pill className="ms-2 flex-shrink-0" style={{ fontSize: '0.65rem' }}>
                            New
                          </Badge>
                        )}
                      </div>
                      <small
                        className="text-muted d-block text-truncate mt-1"
                        style={{ fontSize: '0.82rem', maxHeight: '2.4em' }}
                      >
                        {notification.description}
                      </small>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                        {formatRelativeTime(notification.timestamp)}
                      </small>
                    </div>
                  </div>
                </Dropdown.Item>
              );
            })
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default NotificationsDropdown;
