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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CURRENT_USER_ID =
  localStorage.getItem('user_id') || 'MMC-0001';
const USER_HEADERS = { 'x-user-id': String(CURRENT_USER_ID) };

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

  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

function Avatar({ name, src, size = 48 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-circle flex-shrink-0"
      />
    );
  }

  return (
    <span
      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
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

        const response = await fetch(`${API_URL}/api/messages/conversations`, {
          headers: USER_HEADERS,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load conversations.');
        }

        const data = await response.json();
        const conversationList = Array.isArray(data)
          ? data
          : data.conversations || [];

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

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const registerUser = () => {
      socket.emit('register', CURRENT_USER_ID);
    };

    const handleReceiveMessage = (newMessage) => {
      if (!newMessage) {
        return;
      }

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

      if (CURRENT_USER_ID && senderId === CURRENT_USER_ID) {
        return;
      }

      if (CURRENT_USER_ID && receiverId && receiverId !== CURRENT_USER_ID) {
        return;
      }

      const conversationId = senderId;

      setConversations((previous) => {
        const existingConversation = previous.find(
          (conversation) => conversation.id === conversationId
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
              (conversation) => conversation.id !== conversationId
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
    setConversations((previous) =>
      previous.map((item) =>
        item.id === conversation.id ? { ...item, isUnread: false } : item
      )
    );

    fetch(`${API_URL}/api/messages/read/${conversation.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...USER_HEADERS,
      },
    }).catch((readError) => {
      console.error('Unable to mark conversation as read:', readError);
    });

    navigate(`/messages/${conversation.id}`);
  };

  const filteredConversations = conversations.filter((conversation) => {
    const query = searchQuery.toLowerCase();

    return (
      (conversation.name || '').toLowerCase().includes(query) ||
      (conversation.lastMessage || '').toLowerCase().includes(query)
    );
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
    <Container fluid className="min-vh-100 bg-white p-3 p-md-4">
      <Row className="g-0">
        <Col xs={12}>
          <h1 className="fs-3 fw-bold mb-3">Messages</h1>

          <InputGroup className="w-100 mb-4">
            <InputGroup.Text className="bg-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.099zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
              </svg>
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search conversations"
            />
          </InputGroup>

          <ListGroup variant="flush" className="bg-transparent">
            {filteredConversations.length === 0 ? (
              <ListGroup.Item className="border-0 text-center text-muted py-4">
                No conversations found.
              </ListGroup.Item>
            ) : (
              filteredConversations.map((conversation) => (
                <ListGroup.Item
                  key={conversation.id}
                  action
                  onClick={() => handleConversationClick(conversation)}
                  className="d-flex align-items-center py-3 border-bottom bg-white px-0"
                >
                  <div className="position-relative flex-shrink-0">
                    <Avatar
                      name={conversation.name || conversation.id}
                      src={conversation.profile_picture || conversation.avatar}
                    />
                    {conversation.online && (
                      <span
                        className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
                        style={{ width: 10, height: 10 }}
                        aria-label="Online"
                      />
                    )}
                  </div>
                  <div className="ms-3 flex-grow-1 overflow-hidden">
                    <div
                      className={`mb-0 text-truncate ${
                        conversation.isUnread
                          ? 'fw-bold text-dark'
                          : 'fw-normal text-dark'
                      }`}
                    >
                      {conversation.name || conversation.id}
                    </div>
                    <div
                      className={`small text-truncate mb-0 ${
                        conversation.isUnread
                          ? 'fw-bold text-dark'
                          : 'text-muted'
                      }`}
                    >
                      {conversation.lastMessage}
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end ms-2 flex-shrink-0">
                    <small className="text-muted">
                      {formatListTime(conversation.timestamp)}
                    </small>
                    {conversation.isUnread && (
                      <span
                        className="d-block bg-danger rounded-circle mt-1"
                        style={{ width: 10, height: 10 }}
                        aria-label="Unread conversation"
                      />
                    )}
                  </div>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}
