import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Col,
  Container,
  Form,
  InputGroup,
  ListGroup,
  Row,
  Spinner,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { getCurrentUserId } from '../utils/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const KNOWN_USERS = {
  'MMC-0001': 'Jasmine Requestor',
  'MMC-1042': 'Juan Dela Cruz',
  'MMC-2015': 'Maria Santos',
  'MMC-3044': 'Pedro Penduko',
  'MMC-3045': 'Adrian Friday',
  'MMC-3046': 'Keizy Lara',
};

const getRealFullName = (conversation = {}) => {
  if (conversation.first_name || conversation.last_name) {
    const combined = [conversation.first_name, conversation.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (
      combined &&
      !combined.toLowerCase().startsWith('provider') &&
      !combined.startsWith('MMC-')
    ) {
      return combined;
    }
  }

  const id = conversation.id || conversation.conversation_id;
  if (id && KNOWN_USERS[id]) {
    return KNOWN_USERS[id];
  }

  if (conversation.name) {
    const cleanName = conversation.name
      .replace(/^Provider\s*\(?/i, '')
      .replace(/\)?$/i, '')
      .trim();

    if (KNOWN_USERS[cleanName]) {
      return KNOWN_USERS[cleanName];
    }
    if (cleanName && !cleanName.startsWith('MMC-')) {
      return cleanName;
    }
  }

  return (id && KNOWN_USERS[id]) || conversation.name || id || 'User';
};


const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const formatListTime = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

function Avatar({ name, src, size = 52 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-circle flex-shrink-0 object-fit-cover shadow-sm"
      />
    );
  }

  return (
    <span
      className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 shadow-sm"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: 'linear-gradient(135deg, #0084ff 0%, #00c6ff 100%)',
      }}
      role="img"
      aria-label={`${name} avatar`}
    >
      {getInitials(name)}
    </span>
  );
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const openChatIdRef = useRef(null);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/messages\/([^/]+)$/);

    openChatIdRef.current = match ? decodeURIComponent(match[1]) : null;
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError('');

        const currentUserId = getCurrentUserId();
        const response = await fetch(`${API_URL}/api/messages/conversations`, {
          headers: {
            'x-user-id': String(currentUserId),
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load conversations.');
        }

        const data = await response.json();
        const conversationList = Array.isArray(data)
          ? data
          : Array.isArray(data?.conversations)
          ? data.conversations
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setConversations(conversationList);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError(fetchError.message || 'Unable to load conversations.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchConversations();
    window.addEventListener('serbisyou_user_changed', fetchConversations);

    return () => {
      controller.abort();
      window.removeEventListener('serbisyou_user_changed', fetchConversations);
    };
  }, []);

  useEffect(() => {
    const registerUser = () => {
      const currentUserId = getCurrentUserId();
      socket.emit('register', currentUserId);
    };

    const handleReceiveMessage = (newMessage) => {
      if (!newMessage) {
        return;
      }

      const currentUserId = getCurrentUserId();
      const senderId =
        newMessage.sender_id ?? newMessage.senderId ?? newMessage.from;
      const receiverId =
        newMessage.receiver_id ?? newMessage.receiverId ?? newMessage.to;
      const content = newMessage.content ?? newMessage.message ?? '';
      const timestamp =
        newMessage.timestamp ??
        newMessage.created_at ??
        new Date().toISOString();

      if (!senderId) {
        return;
      }

      if (openChatIdRef.current && senderId === openChatIdRef.current) {
        return;
      }

      if (currentUserId && senderId === currentUserId) {
        return;
      }

      if (currentUserId && receiverId && receiverId !== currentUserId) {
        return;
      }

      const conversationId = senderId;

      setConversations((previous) => {
        const existingConversation = previous.find(
          (conversation) => (conversation.id || conversation.conversation_id) === conversationId
        );

        if (existingConversation) {
          const updatedConversation = {
            ...existingConversation,
            lastMessage: content,
            timestamp,
            isUnread: true,
          };

          return [
            updatedConversation,
            ...previous.filter(
              (conversation) => (conversation.id || conversation.conversation_id) !== conversationId
            ),
          ];
        }

        const newConversation = {
          id: conversationId,
          name:
            newMessage.sender_name ??
            newMessage.senderName ??
            newMessage.from_name ??
            conversationId,
          lastMessage: content,
          timestamp,
          isUnread: true,
          avatar:
            newMessage.sender_avatar ??
            newMessage.senderAvatar ??
            newMessage.avatar ??
            null,
          profile_picture:
            newMessage.sender_profile_picture ??
            newMessage.senderProfilePicture ??
            newMessage.profile_picture ??
            null,
        };

        return [newConversation, ...previous];
      });
    };

    socket.on('connect', registerUser);
    socket.on('receive_message', handleReceiveMessage);
    socket.connect();

    if (socket.connected) {
      registerUser();
    }

    return () => {
      socket.off('connect', registerUser);
      socket.off('receive_message', handleReceiveMessage);
      socket.disconnect();
    };
  }, []);

  const handleConversationClick = (conversation) => {
    const conversationId = conversation.id || conversation.conversation_id;
    if (!conversationId) return;

    const realName = getRealFullName(conversation);

    setConversations((previous) =>
      previous.map((item) =>
        (item.id || item.conversation_id) === conversationId
          ? { ...item, isUnread: false }
          : item
      )
    );

    const currentUserId = getCurrentUserId();
    fetch(`${API_URL}/api/messages/read/${conversationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(currentUserId),
      },
    })
      .then(() => {
        if (socket.connected) {
          socket.emit('mark_read', { user_id: currentUserId, sender_id: conversationId });
        }
        window.dispatchEvent(new CustomEvent('serbisyou_messages_seen', { detail: { partnerId: conversationId } }));
      })
      .catch((readError) => {
        console.error('Unable to mark conversation as read:', readError);
      });

    navigate(`/messages/${conversationId}`, {
      state: {
        name: realName,
        provider_name: realName,
        profile_picture: conversation.profile_picture || conversation.avatar,
        user_id: conversationId,
      },
    });
  };

  const filteredConversations = conversations.filter((conversation) => {
    const query = searchQuery.toLowerCase();
    const realName = getRealFullName(conversation).toLowerCase();
    const lastMsg = (
      conversation.lastMessage ||
      conversation.last_message ||
      ''
    ).toLowerCase();

    return realName.includes(query) || lastMsg.includes(query);
  });

  if (loading) {
    return (
      <Container
        fluid
        className="min-vh-100 bg-white d-flex align-items-center justify-content-center"
      >
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading conversations...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container
        fluid
        className="min-vh-100 bg-white d-flex align-items-center justify-content-center"
      >
        <Alert variant="danger" className="mb-0">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      fluid
      className="p-3 p-md-4"
      style={{ maxWidth: '880px', background: 'var(--neu-bg)' }}
    >
      <Row className="g-0 justify-content-center">
        <Col xs={12}>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="fs-3 fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Messages</h2>
              <p className="text-muted small mb-0">Real-time conversations with your service providers and requestors.</p>
            </div>
          </div>

          <div className="sticky-top mb-4 py-2" style={{ top: 0, zIndex: 10, background: 'var(--neu-bg)' }}>
            <Form.Control
              type="search"
              placeholder="Search conversations by name or message..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search conversations"
              className="neu-input rounded-pill py-2 px-4 shadow-sm"
            />
          </div>

          <ListGroup variant="flush" className="bg-transparent d-flex flex-column gap-2 mb-4">
            {conversations.length === 0 ? (
              <div className="neu-card border-0 text-center text-muted py-5">
                No messages yet. Start a conversation by booking a service!
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="neu-card border-0 text-center text-muted py-4">
                No conversations found matching your search.
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const conversationId =
                  conversation.id || conversation.conversation_id;
                const realName = getRealFullName(conversation);

                return (
                  <div
                    key={conversationId}
                    role="button"
                    onClick={() => handleConversationClick(conversation)}
                    className="neu-card d-flex align-items-center py-3 px-3 rounded-4 transition-all"
                    style={{
                      cursor: 'pointer',
                      borderLeft: conversation.isUnread ? '4px solid #063a8f' : '4px solid transparent',
                    }}
                  >
                    {/* 1. Left: Avatar / DP */}
                    <div className="position-relative flex-shrink-0">
                      <Avatar
                        name={realName}
                        src={
                          conversation.profile_picture || conversation.avatar
                        }
                        size={52}
                      />
                      {conversation.online && (
                        <span
                          className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle"
                          style={{ width: 14, height: 14 }}
                          aria-label="Online"
                        />
                      )}
                    </div>

                    {/* 2. Side-by-Side: Name & Last Message Text right next to DP */}
                    <div className="ms-3 flex-grow-1 overflow-hidden d-flex flex-column justify-content-center pe-2">
                      <div
                        className={`text-truncate mb-0 ${
                          conversation.isUnread
                            ? 'fw-bold text-dark'
                            : 'fw-semibold text-dark'
                        }`}
                        style={{ fontSize: '1rem', lineHeight: 1.3 }}
                      >
                        {realName}
                      </div>
                      <div
                        className={`text-truncate small ${
                          conversation.isUnread
                            ? 'fw-bold text-dark'
                            : 'text-muted'
                        }`}
                        style={{ fontSize: '0.875rem', lineHeight: 1.3 }}
                      >
                        {conversation.lastMessage ||
                          conversation.last_message ||
                          'Started a conversation'}
                      </div>
                    </div>

                    {/* 3. Far Right: Time & Red Unread Dot */}
                    <div className="ms-auto ps-2 d-flex flex-column align-items-end justify-content-center flex-shrink-0">
                      <small
                        className={`mb-1 ${
                          conversation.isUnread
                            ? 'text-primary fw-bold'
                            : 'text-muted'
                        }`}
                        style={{ fontSize: '0.78rem' }}
                      >
                        {formatListTime(conversation.timestamp)}
                      </small>
                      {conversation.isUnread ? (
                        <span
                          className="d-block bg-danger rounded-circle mt-1"
                          style={{ width: 10, height: 10 }}
                          aria-label="Unread conversation"
                        />
                      ) : (
                        <span
                          style={{ width: 10, height: 10 }}
                          className="d-block mt-1"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}
