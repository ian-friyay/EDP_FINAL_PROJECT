import { useEffect, useRef, useState } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';

const CURRENT_USER_ID = 'current_user_id';

const conversations = [
  {
    conversation_id: 'MMC-0002',
    name: 'Juan Cruz',
    profile_picture: null,
    online: true,
  },
  {
    conversation_id: 'MMC-0003',
    name: 'Maria Santos',
    profile_picture: null,
    online: false,
  },
  {
    conversation_id: 'MMC-0004',
    name: 'Pedro Reyes',
    profile_picture: null,
    online: true,
  },
];

const initialMessages = [
  {
    message_id: 'seed-1',
    sender_id: 'MMC-0002',
    receiver_id: CURRENT_USER_ID,
    content: 'Hi! Are you available tomorrow?',
    timestamp: '2026-11-12T09:00:00',
  },
  {
    message_id: 'seed-2',
    sender_id: CURRENT_USER_ID,
    receiver_id: 'MMC-0002',
    content: 'Hello Juan! Yes, I am available after 10 AM.',
    timestamp: '2026-11-12T09:02:00',
    status: 'read',
  },
  {
    message_id: 'seed-3',
    sender_id: 'MMC-0002',
    receiver_id: CURRENT_USER_ID,
    content: 'Perfect. I need help fixing a leaking sink.',
    timestamp: '2026-11-12T09:03:00',
  },
  {
    message_id: 'seed-4',
    sender_id: 'MMC-0003',
    receiver_id: CURRENT_USER_ID,
    content: 'The booking has been accepted.',
    timestamp: '2026-11-11T15:30:00',
  },
  {
    message_id: 'seed-5',
    sender_id: CURRENT_USER_ID,
    receiver_id: 'MMC-0003',
    content: 'Thank you! See you then.',
    timestamp: '2026-11-11T15:32:00',
    status: 'read',
  },
  {
    message_id: 'seed-6',
    sender_id: 'MMC-0004',
    receiver_id: CURRENT_USER_ID,
    content: 'Thank you for your service.',
    timestamp: '2026-11-10T18:45:00',
  },
];

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

function Avatar({ name, src, size = 40 }) {
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
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      role="img"
      aria-label={`${name} avatar`}
    >
      {getInitials(name)}
    </span>
  );
}

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const activeConversationIdRef = useRef(id);
  const readTimersRef = useRef([]);
  const typingTimerRef = useRef(null);

  const activeConversation = conversations.find(
    (conversation) => conversation.conversation_id === id
  );

  const activeMessages = messages
    .filter(
      (message) =>
        (message.sender_id === CURRENT_USER_ID && message.receiver_id === id) ||
        (message.sender_id === id && message.receiver_id === CURRENT_USER_ID)
    )
    .sort(
      (first, second) =>
        new Date(first.timestamp).getTime() - new Date(second.timestamp).getTime()
    );

  useEffect(() => {
    activeConversationIdRef.current = id;
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, id]);

  useEffect(() => {
    const registerUser = () => {
      socket.emit('register', CURRENT_USER_ID);
    };

    const handleReceiveMessage = (newMessage) => {
      setMessages((previous) => [...previous, newMessage]);
    };

    const handleTyping = (payload) => {
      if (!payload) {
        return;
      }

      const senderId = payload.sender_id || payload.user_id;
      const isTyping = payload.isTyping ?? payload.typing ?? false;

      if (senderId === activeConversationIdRef.current) {
        setOtherUserTyping(Boolean(isTyping));
      }
    };

    socket.on('connect', registerUser);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.connect();

    if (socket.connected) {
      registerUser();
    }

    return () => {
      socket.off('connect', registerUser);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.disconnect();
    };
  }, []);

  useEffect(
    () => () => {
      readTimersRef.current.forEach((timer) => clearTimeout(timer));
      readTimersRef.current = [];

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    },
    []
  );

  const handleTextInputChange = (event) => {
    const value = event.target.value;
    const isTyping = value.trim().length > 0;

    setTextInput(value);
    socket.emit('typing', {
      sender_id: CURRENT_USER_ID,
      receiver_id: id,
      isTyping,
    });

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    if (isTyping) {
      setOtherUserTyping(true);
      typingTimerRef.current = setTimeout(() => {
        setOtherUserTyping(false);
      }, 1500);
    } else {
      setOtherUserTyping(false);
    }
  };

  const handleSendMessage = (event) => {
    event.preventDefault();

    const content = textInput.trim();

    if (!content || !id) {
      return;
    }

    const payload = {
      sender_id: CURRENT_USER_ID,
      receiver_id: id,
      content,
    };

    const messageId = `local-${Date.now()}`;
    const optimisticMessage = {
      message_id: messageId,
      ...payload,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    setMessages((previous) => [...previous, optimisticMessage]);
    socket.emit('send_message', payload);
    socket.emit('typing', {
      sender_id: CURRENT_USER_ID,
      receiver_id: id,
      isTyping: false,
    });

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    setOtherUserTyping(false);
    setTextInput('');

    const readTimer = setTimeout(() => {
      setMessages((previous) =>
        previous.map((message) =>
          message.message_id === messageId
            ? { ...message, status: 'read' }
            : message
        )
      );
    }, 2000);

    readTimersRef.current.push(readTimer);
  };

  if (!activeConversation) {
    return (
      <Container
        fluid
        className="min-vh-100 d-flex align-items-center justify-content-center bg-white"
      >
        <div className="text-center">
          <h5 className="fw-bold">Conversation not found</h5>
          <p className="text-muted">This conversation does not exist.</p>
          <Button variant="primary" onClick={() => navigate('/messages')}>
            Back to Inbox
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="min-vh-100 d-flex flex-column bg-white p-0">
      <div className="d-flex align-items-center gap-2 p-3 border-bottom bg-white">
        <Button
          variant="light"
          className="rounded-circle me-2 flex-shrink-0"
          onClick={() => navigate('/messages')}
          aria-label="Back to messages"
        >
          ←
        </Button>
        <Avatar
          name={activeConversation.name}
          src={activeConversation.profile_picture}
        />
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold">{activeConversation.name}</span>
            <span
              className="d-inline-block"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: activeConversation.online ? 'green' : 'gray',
              }}
              aria-label={activeConversation.online ? 'Online' : 'Offline'}
            />
          </div>
          {otherUserTyping ? (
            <small className="text-success">Typing...</small>
          ) : (
            <small
              className={
                activeConversation.online ? 'text-success' : 'text-muted'
              }
            >
              {activeConversation.online ? 'Active now' : 'Offline'}
            </small>
          )}
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-3 bg-light">
        {activeMessages.length === 0 ? (
          <div className="h-100 d-flex align-items-center justify-content-center text-muted">
            No messages yet. Start the conversation!
          </div>
        ) : (
          activeMessages.map((message) => {
            const isSent = message.sender_id === CURRENT_USER_ID;
            const isRead = message.status === 'read';

            return (
              <div
                key={message.message_id}
                className={`d-flex align-items-end mb-3 ${
                  isSent ? 'justify-content-end' : 'justify-content-start'
                }`}
              >
                {!isSent && (
                  <Avatar
                    name={activeConversation.name}
                    src={activeConversation.profile_picture}
                    size={32}
                  />
                )}
                <div
                  className={`d-flex flex-column ${
                    isSent ? 'align-items-end ms-2' : 'align-items-start ms-2'
                  }`}
                  style={{ maxWidth: '70%' }}
                >
                  <div
                    className={`px-3 py-2 rounded-4 ${
                      isSent
                        ? 'bg-primary text-white'
                        : 'bg-light text-dark border'
                    }`}
                  >
                    <div className="text-break">{message.content}</div>
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-1">
                    <small className="text-muted">
                      {formatTime(message.timestamp)}
                    </small>
                    {isSent && (
                      <span
                        className={`small ${
                          isRead ? 'text-primary' : 'text-secondary'
                        }`}
                        aria-label={isRead ? 'Read' : 'Sent'}
                      >
                        {isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-top bg-white">
        <Form onSubmit={handleSendMessage} className="d-flex gap-2">
          <Form.Control
            type="text"
            placeholder="Type a message..."
            value={textInput}
            onChange={handleTextInputChange}
            className="rounded-pill"
            aria-label="Message"
          />
          <Button
            type="submit"
            variant="primary"
            className="rounded-circle p-2 flex-shrink-0"
            disabled={!textInput.trim()}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="currentColor"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
            </svg>
          </Button>
        </Form>
      </div>
    </Container>
  );
}
