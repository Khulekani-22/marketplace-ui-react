
import MessagingSystem from './MessagingSystem';

interface ChatMessageLayerProps {
  userEmail?: string;
  userName?: string;
}

const ChatMessageLayer: React.FC<ChatMessageLayerProps> = ({ userEmail, userName }) => {
  return <MessagingSystem userEmail={userEmail} userName={userName} />;
};

export default ChatMessageLayer;
