import { Container } from 'react-bootstrap';
import ChatInterface from '../components/ChatInterface';

export default function MessagesPage() {
  return (
    <Container fluid className="p-0">
      <ChatInterface />
    </Container>
  );
}
