import { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, ListGroup, Form, Button, Card, Badge } from 'react-bootstrap';

const CURRENT_USER_ID = 'MMC-0001';

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

    const newMessage = {
      message_id: messages.length + 1,
      sender_id: CURRENT_USER_ID,
      receiver_id: activeUserId,
      content,
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
  };

  return (
    <Card className="vh-100 shadow-sm border-0 overflow-hidden">
      <Row className="g-0 h-100">
        <Col md={4} lg={3} className="border-end d-flex flex-column bg-white">
          <Card.Header className="bg-white border-bottom px-3 py-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0 fw-bold">Messages</h6>
              {totalUnread > 0 && (
                <Badge bg="primary" pill>
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
              className="rounded-pill"
              aria-label="Search conversations"
            />
          </Card.Header>

          <ListGroup variant="flush" className="overflow-auto flex-grow-1">
            {filteredConversations.length === 0 ? (
              <ListGroup.Item className="text-center text-muted py-4 border-0">
                No conversations found.
              </ListGroup.Item>
            ) : (
              filteredConversations.map((conversation) => {
                const isActive = conversation.user_id === activeUserId;

                return (
                  <ListGroup.Item
                    key={conversation.user_id}
                    action
                    active={isActive}
                    onClick={() => handleSelectConversation(conversation.user_id)}
                    className="border-0 px-3 py-3"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className={`rounded-circle d-inline-flex align-items-center justify-content-center p-2 fw-bold ${
                          isActive
                            ? 'bg-white text-primary'
                            : 'bg-primary-subtle text-primary'
                        }`}
                      >
                        {conversation.initials}
                      </span>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold text-truncate">
                            {conversation.name}
                          </span>
                          <small
                            className={isActive ? 'text-white-50' : 'text-muted'}
                          >
                            {conversation.lastSeen}
                          </small>
                        </div>
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <small
                            className={`text-truncate ${
                              isActive ? 'text-white-50' : 'text-muted'
                            }`}
                          >
                            {conversation.lastMessage}
                          </small>
                          {conversation.unread > 0 && (
                            <Badge
                              bg={isActive ? 'light' : 'danger'}
                              className={isActive ? 'text-dark' : undefined}
                              pill
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

        <Col md={8} lg={9} className="d-flex flex-column">
          <Card.Header className="bg-white border-bottom px-3 py-2">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <span className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center p-2 fw-bold">
                  {activeConversation ? activeConversation.initials : '--'}
                </span>
                <div>
                  <div className="fw-semibold">
                    {activeConversation
                      ? activeConversation.name
                      : 'Select a conversation'}
                  </div>
                  <small
                    className={
                      activeConversation?.online ? 'text-success' : 'text-muted'
                    }
                  >
                    {activeConversation?.online ? 'Active now' : 'Offline'}
                  </small>
                </div>
              </div>

              <div className="d-flex gap-1">
                <Button
                  variant="light"
                  className="rounded-circle p-2"
                  aria-label="Voice call"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z" />
                  </svg>
                </Button>
                <Button
                  variant="light"
                  className="rounded-circle p-2"
                  aria-label="Video call"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2z"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className="overflow-auto flex-grow-1 bg-body-tertiary px-3 py-3">
            {activeMessages.length === 0 ? (
              <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                No messages yet. Start the conversation.
              </div>
            ) : (
              <>
                <div className="text-center mb-3">
                  <Badge className="bg-secondary-subtle text-secondary fw-normal">
                    {formatDateLabel(activeMessages[0].timestamp)}
                  </Badge>
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
                          <span className="rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center p-1 fw-bold small">
                            {activeConversation ? activeConversation.initials : '--'}
                          </span>
                        </Col>
                      )}

                      <Col
                        xs={10}
                        md={8}
                        lg={7}
                        className={isSent ? 'text-end' : 'text-start'}
                      >
                        <div
                          className={`d-inline-block text-start px-3 py-2 rounded-4 shadow-sm ${
                            isSent
                              ? 'bg-primary text-white'
                              : 'bg-white border'
                          }`}
                        >
                          <div className="text-break">{message.content}</div>
                        </div>
                        <div
                          className={`small mt-1 text-muted ${
                            isSent ? 'text-end' : 'text-start'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                          {isSent && (
                            <span className="ms-2 text-primary">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                fill="currentColor"
                                viewBox="0 0 16 16"
                                className="me-1"
                                aria-hidden="true"
                              >
                                <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0" />
                              </svg>
                              Read
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
          </Card.Body>

          <Card.Footer className="bg-white border-top p-2">
            <Form onSubmit={handleSend} className="d-flex align-items-center gap-2">
              <Button
                variant="light"
                className="rounded-circle p-2"
                aria-label="Attach file"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
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
                className="rounded-pill bg-light border-0 px-3"
              />

              <Button
                type="submit"
                variant="primary"
                className="rounded-circle p-2"
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
          </Card.Footer>
        </Col>
      </Row>
    </Card>
  );
}

export default ChatInterface;
