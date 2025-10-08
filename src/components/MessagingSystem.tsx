import React, { useState, useEffect, useRef } from 'react';
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

interface User {
  uid: string;
  email: string;
  name: string;
  avatar: string;
  type: string;
  role?: string;
}

interface Message {
  id: string;
  subject: string;
  from: User;
  to: User;
  content: string;
  timestamp: string;
  status: string;
  priority: string;
  labels: string[];
  threadId: string;
  attachments: any[];
  metadata: any;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  avatar: string;
  type: string;
  status: string;
  lastActivity?: string;
}

const MessagingSystem = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = 'http://localhost:5500/api';

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/me`);
        const user = await response.json();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(`${API_BASE}/messages/contacts`);
        const data = await response.json();
        if (data.success) {
          setContacts(data.contacts);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_BASE}/messages?limit=100`);
        const data = await response.json();
        setMessages(data.messages || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Fetch conversation when contact is selected
  useEffect(() => {
    if (selectedContact && currentUser) {
      const fetchConversation = async () => {
        try {
          const response = await fetch(
            `${API_BASE}/messages/conversation?user1=${currentUser.email}&user2=${selectedContact.email}`
          );
          const data = await response.json();
          if (data.success) {
            setConversationMessages(data.conversation || []);
          }
        } catch (error) {
          console.error('Error fetching conversation:', error);
        }
      };

      fetchConversation();
    }
  }, [selectedContact, currentUser]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !currentUser || sending) {
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedContact.email,
          subject: `Message to ${selectedContact.name}`,
          content: newMessage,
          priority: 'normal',
          from: {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.name || currentUser.email,
            type: currentUser.role || 'user'
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Add the new message to the conversation
        setConversationMessages(prev => [...prev, data.data]);
        setNewMessage('');
        
        // Refresh messages list
        const messagesResponse = await fetch(`${API_BASE}/messages?limit=100`);
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get last message with contact
  const getLastMessageWithContact = (contact: Contact) => {
    const contactMessages = messages.filter(msg => 
      (msg.from.email === contact.email && msg.to.email === currentUser?.email) ||
      (msg.from.email === currentUser?.email && msg.to.email === contact.email)
    );
    
    return contactMessages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };

  // Get unread count for contact
  const getUnreadCount = (contact: Contact) => {
    return messages.filter(msg => 
      msg.from.email === contact.email && 
      msg.to.email === currentUser?.email && 
      msg.status === 'unread'
    ).length;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='chat-wrapper'>
      <div className='chat-sidebar card'>
        <div className='chat-sidebar-single active top-profile'>
          <div className='img'>
            <img src={currentUser?.avatar || 'assets/images/chat/1.png'} alt='Current user' />
          </div>
          <div className='info'>
            <h6 className='text-md mb-0'>{currentUser?.name || 'User'}</h6>
            <p className='mb-0'>Available</p>
          </div>
          <div className='action'>
            <div className='btn-group'>
              <button
                type='button'
                className='text-secondary-light text-xl'
                data-bs-toggle='dropdown'
                data-bs-display='static'
                aria-expanded='false'
              >
                <Icon icon='bi:three-dots' />
              </button>
              <ul className='dropdown-menu dropdown-menu-lg-end border'>
                <li>
                  <Link
                    to='/chat-profile'
                    className='dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2'
                  >
                    <Icon icon='fluent:person-32-regular' />
                    Profile
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className='chat-search'>
          <form>
            <input type='text' name='chatSearch' placeholder='Search here...' />
            <Icon icon='iconoir:search' className='search-icon' />
          </form>
        </div>

        <div className='chat-all-list'>
          {contacts.map((contact) => {
            const lastMessage = getLastMessageWithContact(contact);
            const unreadCount = getUnreadCount(contact);
            
            return (
              <div 
                key={contact.id}
                className={`chat-sidebar-single ${selectedContact?.id === contact.id ? 'active' : ''}`}
                onClick={() => setSelectedContact(contact)}
                style={{ cursor: 'pointer' }}
              >
                <div className='img'>
                  <img src={contact.avatar} alt={contact.name} />
                </div>
                <div className='info'>
                  <h6 className='text-sm mb-1'>{contact.name}</h6>
                  <p className='mb-0 text-xs'>
                    {lastMessage ? 
                      (lastMessage.content.length > 30 ? 
                        lastMessage.content.substring(0, 30) + '...' : 
                        lastMessage.content
                      ) : 
                      'No messages yet'
                    }
                  </p>
                </div>
                <div className='action text-end'>
                  <p className='mb-0 text-neutral-400 text-xs lh-1'>
                    {lastMessage ? formatTime(lastMessage.timestamp) : ''}
                  </p>
                  {unreadCount > 0 && (
                    <span className='w-16-px h-16-px text-xs rounded-circle bg-warning-main text-white d-inline-flex align-items-center justify-content-center'>
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className='chat-main card'>
        {selectedContact ? (
          <>
            <div className='chat-sidebar-single active'>
              <div className='img'>
                <img src={selectedContact.avatar} alt={selectedContact.name} />
              </div>
              <div className='info'>
                <h6 className='text-md mb-0'>{selectedContact.name}</h6>
                <p className='mb-0'>{selectedContact.status}</p>
              </div>
              <div className='action d-inline-flex align-items-center gap-3'>
                <button type='button' className='text-xl text-primary-light'>
                  <Icon icon='mi:call' />
                </button>
                <button type='button' className='text-xl text-primary-light'>
                  <Icon icon='fluent:video-32-regular' />
                </button>
                <div className='btn-group'>
                  <button
                    type='button'
                    className='text-primary-light text-xl'
                    data-bs-toggle='dropdown'
                    data-bs-display='static'
                    aria-expanded='false'
                  >
                    <Icon icon='tabler:dots-vertical' />
                  </button>
                  <ul className='dropdown-menu dropdown-menu-lg-end border'>
                    <li>
                      <button
                        className='dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2'
                        type='button'
                      >
                        <Icon icon='mdi:clear-circle-outline' />
                        Clear All
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className='chat-message-list' style={{maxHeight: '400px', overflowY: 'auto'}}>
              {conversationMessages.map((message) => {
                const isFromCurrentUser = message.from.email === currentUser?.email;
                
                return (
                  <div key={message.id} className={`chat-single-message ${isFromCurrentUser ? 'right' : 'left'}`}>
                    {!isFromCurrentUser && (
                      <img
                        src={message.from.avatar}
                        alt={message.from.name}
                        className='avatar-lg object-fit-cover rounded-circle'
                      />
                    )}
                    <div className='chat-message-content'>
                      <p className='mb-3'>{message.content}</p>
                      <p className='chat-time mb-0'>
                        <span>{formatTime(message.timestamp)}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className='chat-message-box' onSubmit={handleSendMessage}>
              <input 
                type='text' 
                name='chatMessage' 
                placeholder='Write message'
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
              />
              <div className='chat-message-box-action'>
                <button type='button' className='text-xl'>
                  <Icon icon='ph:link' />
                </button>
                <button type='button' className='text-xl'>
                  <Icon icon='solar:gallery-linear' />
                </button>
                <button
                  type='submit'
                  className='btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1'
                  disabled={sending || !newMessage.trim()}
                >
                  {sending ? 'Sending...' : 'Send'}
                  <Icon icon='f7:paperplane' />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className='d-flex flex-column align-items-center justify-content-center h-100 text-center'>
            <Icon icon='fluent:chat-48-regular' className='text-primary' style={{fontSize: '4rem'}} />
            <h5 className='mt-3 mb-2'>Select a conversation</h5>
            <p className='text-muted'>Choose a contact from the sidebar to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingSystem;
