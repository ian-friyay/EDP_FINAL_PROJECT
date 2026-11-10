import { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, ListGroup, Form, Button, Card, Badge } from 'react-bootstrap';

const CURRENT_USER_ID = 'MMC-0001';

const initialConversations = [
  {
    user_id: 'MMC-0002',
    name: 'Juan Cruz',
    lastMessage: 'See you tomorrow!',
    unread: 2,
  },
  {
    user_id: 'MMC-0003',
    name: 'Maria Santos',
    lastMessage: 'The booking has been accepted.',
    unread: 0,
  },
  {
    user_id: 'MMC-0004',
    name: 'Pedro Reyes',
    lastMessage: 'Thank you for your service.',
    unread: 1,
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
    content: 'Great! See you tomorrow!',
    timestamp: '2026-02-11T09:05:00',
  },
  {
    message_id: 4,
    sender_id: 'MMC-0003',
    receiver_id: 'MMC-0001',
    content: 'The booking has been accepted.',
    timestamp: '2026-02-10T15:30:00',
  },
  {
    message_id: 5,
    sender_id: 'MMC-0004',
    receiver_id: 'MMC-0001',
    content: 'Thank you for your service.',
    timestamp: '2026-02-09T18:45:00',
  },
];

function ChatInterface() {
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState(initialMessages);
  const [activeUserId, setActiveUserId] = useState(initialConversations[0].user_id);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const activeConversation = conversations.find(
    (conversation) => conversation.user_id === activeUserId
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
          ? { ...conversation, lastMessage: content }
          : conversation
      )
    );
    setInput('');
  };

  return (
    <Card className="vh-100 shadow-sm">
      <Row className="g-0 h-100">
        <Col md={4} lg={3} className="border-end d-flex flex-column">
          <Card.Header className="bg-primary text-white fw-semibold">
            Conversations
          </Card.Header>
          <ListGroup variant="flush" className="overflow-auto flex-grow-1">
            {conversations.map((conversation) => (
              <ListGroup.Item
                key={conversation.user_id}
                action
                active={conversation.user_id === activeUserId}
                onClick={() => handleSelectConversation(conversation.user_id)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-truncate">
                    <div className="fw-semibold">{conversation.name}</div>
                    <small
                      className={
                        conversation.user_id === activeUserId
                          ? 'text-white-50 d-block text-truncate'
                          : 'text-muted d-block text-truncate'
                      }
                    >
                      {conversation.lastMessage}
                    </small>
                  </div>
                  {conversation.unread > 0 && (
                    <Badge bg="danger" pill className="ms-2">
                      {conversation.unread}
                    </Badge>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>

        <Col md={8} lg={9} className="d-flex flex-column">
          <Card.Header className="bg-white fw-semibold">
            {activeConversation ? activeConversation.name : 'Select a conversation'}
          </Card.Header>

          <Card.Body className="overflow-auto flex-grow-1 bg-light">
            {activeMessages.length === 0 ? (
              <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                No messages yet. Start the conversation.
              </div>
            ) : (
              activeMessages.map((message) => {
                const isSent = message.sender_id === CURRENT_USER_ID;

                return (
                  <div
                    key={message.message_id}
                    className={`d-flex mb-2 ${
                      isSent ? 'justify-content-end' : 'justify-content-start'
                    }`}
                  >
                    <div
                      className={`px-3 py-2 rounded text-break ${
                        isSent
                          ? 'bg-primary text-white'
                          : 'bg-secondary-subtle text-dark'
                      }`}
                    >
                      <div>{message.content}</div>
                      <small
                        className={`d-block mt-1 ${
                          isSent ? 'text-white-50' : 'text-muted'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString('en-PH', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </small>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </Card.Body>

          <Card.Footer className="bg-white">
            <Form onSubmit={handleSend} className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                aria-label="Message"
              />
              <Button type="submit" variant="primary" disabled={!input.trim()}>
                Send
              </Button>
            </Form>
          </Card.Footer>
        </Col>
      </Row>
    </Card>
  );
}

export default ChatInterface;
