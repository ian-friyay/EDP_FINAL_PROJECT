import { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, ListGroup, Form, Button, Badge } from 'react-bootstrap';
import socket from '../socket';

const CURRENT_USER_ID =
  (typeof window !== 'undefined' && (window.localStorage.getItem('user_id') || (JSON.parse(window.localStorage.getItem('user') || '{}')).user_id)) ||
  'MMC-0001';

const initialConversations = [
  {
    user_id: 'MMC-0002',
    name: 'Juan Cruz',
    initials: 'JC',
    lastMessage: 'See you tomorrow!',
    lastSeen: '2m',
    unread: 2,
    online: true,
  },
  {
    user_id: 'MMC-0003',
    name: 'Maria Santos',
    initials: 'MS',
    lastMessage: 'The booking has been accepted.',
    lastSeen: '1h',
    unread: 0,
    online: false,
  },
  {
    user_id: 'MMC-0004',
    name: 'Pedro Reyes',
    initials: 'PR',
    lastMessage: 'Thank you for your service.',
    lastSeen: '3h',
    unread: 1,
    online: true,
  },
];

const initialMessages = [
  {
    message_id: 1,
    sender_id: 'MMC-0002',
    receiver_id: 'MMC-0001',
    content: 'Hi Jasmine! Are you available tomorrow?',
    timestamp: '2026-02-11T09:00:00',
  },
  {
    message_id: 2,
    sender_id: 'MMC-0001',
    receiver_id: 'MMC-0002',
    content: 'Hello Juan! Yes, I am available after 10 AM.',
    timestamp: '2026-02-11T09:02:00',
  },
  {
    message_id: 3,
    sender_id: 'MMC-0002',
    receiver_id: 'MMC-0001',
    content: 'Perfect. I need help fixing a leaking sink.',
    timestamp: '2026-02-11T09:03:00',
  },
  {
    message_id: 4,
    sender_id: 'MMC-0001',
    receiver_id: 'MMC-0002',
    content: 'Noted. Please send the exact address.',
    timestamp: '2026-02-11T09:04:00',
  },
  {
    message_id: 5,
    sender_id: 'MMC-0002',
    receiver_id: 'MMC-0001',
    content: '123 Mabini St., Barangay San Isidro.',
    timestamp: '2026-02-11T09:05:00',
  },
  {
    message_id: 6,
    sender_id: 'MMC-0002',
    receiver_id: 'MMC-0001',
    content: 'See you tomorrow!',
    timestamp: '2026-02-11T09:06:00',
  },
  {
    message_id: 7,
    sender_id: 'MMC-0003',
    receiver_id: 'MMC-0001',
    content: 'The booking has been accepted.',
    timestamp: '2026-02-10T15:30:00',
  },
  {
    message_id: 8,
    sender_id: 'MMC-0001',
    receiver_id: 'MMC-0003',
    content: 'Thank you! See you then.',
    timestamp: '2026-02-10T15:32:00',
  },
  {
    message_id: 9,
    sender_id: 'MMC-0004',
    receiver_id: 'MMC-0001',
    content: 'Thank you for your service.',
    timestamp: '2026-02-09T18:45:00',
  },
  {
    message_id: 10,
    sender_id: 'MMC-0001',
    receiver_id: 'MMC-0004',
    content: "You're welcome, Pedro!",
    timestamp: '2026-02-09T18:47:00',
  },
];

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  });

const formatDateLabel = (timestamp) =>
  new Date(timestamp).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

function ChatInterface() {
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState(initialMessages);
  const [activeUserId, setActiveUserId] = useState(initialConversations[0].user_id);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);
  const activeUserIdRef = useRef(activeUserId);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  const activeConversation = conversations.find(
    (conversation) => conversation.user_id === activeUserId
  );

  const totalUnread = conversations.reduce(
    (total, conversation) => total + conversation.unread,
    0
  );

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeMessages = useMemo(
    () =>
      messages
        .filter(
          (message) =>
            (message.sender_id === CURRENT_USER_ID &&
              message.receiver_id === activeUserId) ||
            (message.sender_id === activeUserId &&
              message.receiver_id === CURRENT_USER_ID)
        )
        .sort(
          (first, second) =>
            new Date(first.timestamp).getTime() - new Date(second.timestamp).getTime()
        ),
    [messages, activeUserId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  useEffect(() => {
    const registerUser = () => {
      socket.emit('register', CURRENT_USER_ID);
    };

    const handleReceiveMessage = (message) => {
      if (!message || !message.sender_id) {
        return;
      }

      setMessages((previous) => {
        const alreadyExists = previous.some(
          (item) => String(item.message_id) === String(message.message_id)
        );

        return alreadyExists ? previous : [...previous, message];
      });

      setConversations((previous) =>
        previous.map((conversation) => {
          if (conversation.user_id !== message.sender_id) {
            return conversation;
          }

          const isActiveSender =
            message.sender_id === activeUserIdRef.current;

          return {
            ...conversation,
            lastMessage: message.content,
            lastSeen: 'now',
            unread: isActiveSender ? 0 : conversation.unread + 1,
          };
        })
      );
    };

    const handleMessageError = (payload) => {
      console.error('Message send failed:', payload?.error);
    };

    socket.on('connect', registerUser);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_error', handleMessageError);

    if (socket.connected) {
      registerUser();
    }

    return () => {
      socket.off('connect', registerUser);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_error', handleMessageError);
    };
  }, []);

  const handleSelectConversation = (userId) => {
    setActiveUserId(userId);
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.user_id === userId
          ? { ...conversation, unread: 0 }
          : conversation
      )
    );
  };

  const handleSend = (event) => {
    event.preventDefault();

    const content = input.trim();

    if (!content) {
      return;
    }

    const payload = {
      sender_id: CURRENT_USER_ID,
      receiver_id: activeUserId,
      content,
    };

    const newMessage = {
      message_id: `local-${Date.now()}`,
      ...payload,
      timestamp: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, newMessage]);
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.user_id === activeUserId
          ? { ...conversation, lastMessage: content, lastSeen: 'now' }
          : conversation
      )
    );
    setInput('');
    socket.emit('send_message', payload);
  };

  return (
    <div
      className="neu-chat-card d-flex flex-column"
      style={{ height: 'calc(100vh - 120px)', minHeight: '560px' }}
    >
      <Row className="g-0 h-100 flex-grow-1">
        {/* Left Side: Conversations Sidebar */}
        <Col md={5} lg={4} className="neu-chat-sidebar d-flex flex-column h-100">
          <div className="p-3 border-bottom" style={{ borderColor: 'rgba(154, 172, 196, 0.35)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--neu-text)' }}>Messages</h5>
              {totalUnread > 0 && (
                <Badge bg="primary" pill className="px-2 py-1">
                  {totalUnread} new
                </Badge>
              )}
            </div>
            <Form.Control
              type="search"
              size="sm"
              placeholder="Search conversations..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="neu-input"
              aria-label="Search conversations"
            />
          </div>

          <ListGroup variant="flush" className="overflow-auto flex-grow-1 p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-muted py-4 small">
                No conversations found.
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isActive = conversation.user_id === activeUserId;

                return (
                  <ListGroup.Item
                    key={conversation.user_id}
                    action
                    onClick={() => handleSelectConversation(conversation.user_id)}
                    className="border-0 mb-2 p-2"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%)'
                        : 'var(--neu-bg)',
                      borderRadius: 'var(--neu-radius)',
                      boxShadow: isActive
                        ? '3px 3px 8px rgba(8, 75, 181, 0.4), -2px -2px 5px rgba(232, 239, 248, 0.5)'
                        : 'var(--neu-shadow-sm)',
                      color: isActive ? '#fff' : 'var(--neu-text)',
                      cursor: 'pointer',
                      transition: 'all var(--neu-transition)',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                        style={{
                          width: '38px',
                          height: '38px',
                          background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--neu-bg-dark)',
                          color: isActive ? '#fff' : 'var(--neu-primary)',
                          boxShadow: isActive ? 'none' : 'var(--neu-shadow-inset)',
                          fontSize: '0.85rem',
                        }}
                      >
                        {conversation.initials}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold text-truncate small">
                            {conversation.name}
                          </span>
                          <small
                            className="ms-1 flex-shrink-0"
                            style={{
                              color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--neu-text-light)',
                              fontSize: '0.7rem',
                            }}
                          >
                            {conversation.lastSeen}
                          </small>
                        </div>
                        <div className="d-flex justify-content-between align-items-center gap-2 mt-1">
                          <small
                            className="text-truncate"
                            style={{
                              color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--neu-text-muted)',
                              fontSize: '0.78rem',
                            }}
                          >
                            {conversation.lastMessage}
                          </small>
                          {conversation.unread > 0 && (
                            <Badge
                              bg={isActive ? 'light' : 'danger'}
                              text={isActive ? 'primary' : 'white'}
                              pill
                              className="small"
                              style={{ fontSize: '0.65rem' }}
                            >
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                );
              })
            )}
          </ListGroup>
        </Col>

        {/* Right Side: Message Thread & Input */}
        <Col md={7} lg={8} className="d-flex flex-column h-100">
          {/* Active Conversation Header */}
          <div
            className="p-3 border-bottom d-flex align-items-center justify-content-between"
            style={{
              background: 'var(--neu-bg-dark)',
              borderColor: 'rgba(154, 172, 196, 0.35)',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <span
                className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%)',
                  color: '#fff',
                  boxShadow: '2px 2px 5px rgba(8, 75, 181, 0.3)',
                }}
              >
                {activeConversation ? activeConversation.initials : '--'}
              </span>
              <div>
                <div className="fw-bold" style={{ color: 'var(--neu-text)', fontSize: '0.95rem' }}>
                  {activeConversation
                    ? activeConversation.name
                    : 'Select a conversation'}
                </div>
                <small className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                  <span
                    className="rounded-circle d-inline-block"
                    style={{
                      width: '7px',
                      height: '7px',
                      background: activeConversation?.online ? 'var(--neu-success)' : 'var(--neu-text-light)',
                    }}
                  />
                  <span className={activeConversation?.online ? 'text-success fw-semibold' : 'text-muted'}>
                    {activeConversation?.online ? 'Active now' : 'Offline'}
                  </span>
                </small>
              </div>
            </div>

            {activeConversation && (
              <Badge bg="secondary" className="bg-opacity-25 text-dark font-monospace small px-2 py-1">
                {activeConversation.user_id}
              </Badge>
            )}
          </div>

          {/* Messages Scroll Area */}
          <div
            className="overflow-auto flex-grow-1 p-3 p-md-4"
            style={{ background: 'var(--neu-bg)' }}
          >
            {activeMessages.length === 0 ? (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16" className="mb-2 opacity-50">
                  <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                </svg>
                <span>No messages yet. Start the conversation.</span>
              </div>
            ) : (
              <>
                <div className="text-center mb-3">
                  <span
                    className="small px-3 py-1 rounded-pill"
                    style={{
                      background: 'var(--neu-bg-dark)',
                      color: 'var(--neu-text-muted)',
                      boxShadow: 'var(--neu-shadow-sm)',
                      fontSize: '0.72rem',
                    }}
                  >
                    {formatDateLabel(activeMessages[0].timestamp)}
                  </span>
                </div>

                {activeMessages.map((message) => {
                  const isSent = message.sender_id === CURRENT_USER_ID;

                  return (
                    <Row
                      key={message.message_id}
                      className={`g-0 mb-3 ${
                        isSent ? 'justify-content-end' : 'justify-content-start'
                      }`}
                    >
                      {!isSent && (
                        <Col xs="auto" className="me-2">
                          <span
                            className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold small"
                            style={{
                              width: '30px',
                              height: '30px',
                              background: 'var(--neu-bg-dark)',
                              color: 'var(--neu-primary)',
                              boxShadow: 'var(--neu-shadow-sm)',
                              fontSize: '0.75rem',
                            }}
                          >
                            {activeConversation ? activeConversation.initials : '--'}
                          </span>
                        </Col>
                      )}

                      <Col
                        xs={10}
                        sm={9}
                        md={8}
                        lg={7}
                        className={isSent ? 'text-end' : 'text-start'}
                      >
                        <div
                          className={`d-inline-block text-start ${
                            isSent ? 'neu-chat-bubble-sent' : 'neu-chat-bubble-received'
                          }`}
                        >
                          <div className="text-break" style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                            {message.content}
                          </div>
                        </div>
                        <div
                          className="mt-1"
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--neu-text-light)',
                          }}
                        >
                          {formatTime(message.timestamp)}
                          {isSent && (
                            <span className="ms-2" style={{ color: 'var(--neu-primary)' }}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                fill="currentColor"
                                viewBox="0 0 16 16"
                                className="me-1"
                                aria-hidden="true"
                              >
                                <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0" />
                              </svg>
                              Delivered
                            </span>
                          )}
                        </div>
                      </Col>
                    </Row>
                  );
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div
            className="p-3 border-top"
            style={{
              background: 'var(--neu-bg-dark)',
              borderColor: 'rgba(154, 172, 196, 0.35)',
            }}
          >
            <Form onSubmit={handleSend} className="d-flex align-items-center gap-2">
              <Button
                variant="link"
                className="neu-btn-ghost rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px' }}
                aria-label="Attach file"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z" />
                </svg>
              </Button>

              <Form.Control
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                aria-label="Message"
                className="neu-chat-input flex-grow-1"
              />

              <Button
                type="submit"
                className="neu-chat-send-btn flex-shrink-0"
                disabled={!input.trim()}
                aria-label="Send message"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                </svg>
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default ChatInterface;
