import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, bootstrapSession, getSession } from '../lib/api';

type SessionInfo = ReturnType<typeof getSession>;

interface ParticipantSummary {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface ThreadSummary {
  id: string;
  kind: 'thread' | 'legacy';
  subject: string;
  lastMessageSnippet: string;
  lastMessageAt?: string;
  unreadCount?: number;
  participants: ParticipantSummary[];
  context?: Record<string, any>;
  legacy?: {
    user1?: string;
    user2?: string;
  };
  raw?: any;
}

interface ContactSummary {
  id: string;
  threadId: string;
  name: string;
  email?: string;
  avatar: string;
  status: string;
  type: 'thread' | 'legacy';
  lastMessageSnippet: string;
  lastMessageAt?: string;
  unreadCount?: number;
  thread: ThreadSummary;
}

interface ConversationMessage {
  id: string;
  senderId?: string;
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
}

function truncate(text: string, max = 80) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function placeholderAvatar(name: string) {
  const safeName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${safeName}&background=059669&color=fff`;
}

function normalizeLegacyMessage(message: any): ConversationMessage {
  const from = message?.from || {};
  const timestamp = message?.timestamp || message?.date || new Date().toISOString();
  return {
    id: String(message?.id || timestamp),
    senderId: from?.uid || from?.email,
    senderName: from?.name || from?.email || 'User',
    senderEmail: from?.email,
    senderRole: from?.type,
    senderAvatar: from?.avatar,
    content: (message?.content ?? '').toString(),
    timestamp,
  };
}

function normalizeMessagesFromThread(thread: any, fallbackContext?: Record<string, any>): ConversationMessage[] {
  const items = Array.isArray(thread?.messages) ? thread.messages : [];
  const context = thread?.context || fallbackContext || {};
  const normalized = items.map((msg: any) => {
    const role = msg?.senderRole || msg?.role;
    let senderEmail = msg?.senderEmail || msg?.email;
    if (!senderEmail) {
      const lowered = (role || '').toLowerCase();
      if (lowered === 'admin' && context.adminEmail) senderEmail = context.adminEmail;
      if (lowered === 'vendor' && context.vendorEmail) senderEmail = context.vendorEmail;
      if (lowered === 'subscriber' && context.subscriberEmail) senderEmail = context.subscriberEmail;
    }
    const timestamp = msg?.date || msg?.timestamp || msg?.createdAt || new Date().toISOString();
    return {
      id: String(msg?.id || msg?.messageId || timestamp),
      senderId: msg?.senderId || msg?.sender?.id,
      senderName: msg?.senderName || msg?.sender?.name || msg?.senderId || 'User',
      senderEmail,
      senderRole: role,
      senderAvatar: msg?.senderAvatar || msg?.sender?.avatar,
      content: (msg?.content ?? msg?.text ?? '').toString(),
      timestamp,
    };
  });
  normalized.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return normalized;
}

function normalizeLegacyThreads(messages: any[]): ThreadSummary[] {
  const grouped = new Map<string, any[]>();
  messages.forEach((message) => {
    if (!message) return;
    const key = String(message.threadId || message.id || message.subject || `legacy-${Date.now()}`);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(message);
  });

  const threads: ThreadSummary[] = [];
  for (const [threadId, list] of grouped.entries()) {
    list.sort(
      (a, b) => new Date(a?.timestamp || a?.date || 0).getTime() - new Date(b?.timestamp || b?.date || 0).getTime()
    );
    const first = list[0];
    const last = list[list.length - 1] || first;
    const participants: ParticipantSummary[] = [];
    if (first?.from) {
      participants.push({
        id: first.from.uid || first.from.email || first.from.name,
        name: first.from.name || first.from.email,
        email: first.from.email,
        role: first.from.type,
      });
    }
    if (first?.to) {
      participants.push({
        id: first.to.uid || first.to.email || first.to.name,
        name: first.to.name || first.to.email,
        email: first.to.email,
        role: first.to.type,
      });
    }

    threads.push({
      id: threadId,
      kind: 'legacy',
      subject: last?.subject || first?.subject || 'Conversation',
      lastMessageSnippet: truncate(last?.content || ''),
      lastMessageAt: last?.timestamp || last?.date,
      participants,
      legacy: {
        user1: participants[0]?.email,
        user2: participants[1]?.email,
      },
      raw: list,
    });
  }
  return threads;
}

function normalizeNewThread(item: any): ThreadSummary {
  const messages = Array.isArray(item?.messages) ? [...item.messages] : [];
  const last = item?.lastMessage || messages[messages.length - 1] || {};
  const participants: ParticipantSummary[] = Array.isArray(item?.participants)
    ? item.participants.map((participant: any) => ({
        id: participant?.id || participant?.email || participant?.name,
        name: participant?.name || participant?.id || 'Participant',
        email: participant?.email,
        role: participant?.role,
      }))
    : [];
  const context = item?.context || {};

  const thread: ThreadSummary = {
    id: String(item?.id || item?.threadId || context.threadId || `thread-${Date.now()}`),
    kind: 'thread',
    subject: item?.subject || context.listingTitle || context.serviceTitle || 'Conversation',
    lastMessageSnippet: truncate(item?.lastMessage?.snippet || last?.snippet || last?.content || ''),
    lastMessageAt: last?.date || last?.timestamp || item?.updatedAt || item?.createdAt,
    unreadCount: typeof item?.unreadCount === 'number' ? item.unreadCount : undefined,
    participants,
    context,
    raw: item,
  };

  const vendorEmail = context.vendorEmail;
  const adminEmail = context.adminEmail;
  const subscriberEmail = context.subscriberEmail;

  if (vendorEmail) {
    const vendor = thread.participants.find(
      (participant) => (participant?.role || '').toLowerCase() === 'vendor' || (participant?.id || '').startsWith('vendor:')
    );
    if (vendor && !vendor.email) vendor.email = vendorEmail;
  }
  if (adminEmail) {
    const admin = thread.participants.find((participant) => (participant?.role || '').toLowerCase() === 'admin');
    if (admin && !admin.email) admin.email = adminEmail;
  }
  if (subscriberEmail) {
    const subscriber = thread.participants.find((participant) => (participant?.role || '').toLowerCase() === 'subscriber');
    if (subscriber && !subscriber.email) subscriber.email = subscriberEmail;
  }

  return thread;
}

const MessagingSystem = () => {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactSummary | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(() => {
    try {
      return getSession();
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  type ContactEntry = {
    email: string;
    name: string;
    role: string;
    type: string;
    tenantId?: string;
  };
  const [allContacts, setAllContacts] = useState<ContactEntry[]>([]);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientDropdownOpen, setRecipientDropdownOpen] = useState(false);

  useEffect(() => {
    if (showComposeModal) {
      api.get('/api/users/all-contacts')
        .then(res => setAllContacts(res.data.items || []))
        .catch(() => setAllContacts([]));
    }
  }, [showComposeModal]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages, scrollToBottom]);

  useEffect(() => {
    bootstrapSession()
      .then((session) => setCurrentSession(session))
      .catch(() => {
        // leave existing session info (likely unauthenticated)
      });
  }, []);

  const buildContacts = useCallback(
    (threadList: ThreadSummary[]): ContactSummary[] => {
      const sessionEmail = (currentSession?.email || '').toLowerCase();
      return threadList
        .map((thread) => {
          const participants = thread.participants || [];
          let counterpart = participants.find(
            (participant) => (participant?.email || '').toLowerCase() !== sessionEmail
          );
          if (!counterpart && participants.length) counterpart = participants[0];
          const name = counterpart?.name || counterpart?.email || thread.subject || 'Conversation';
          const email =
            counterpart?.email ||
            (thread.legacy
              ? [thread.legacy.user1, thread.legacy.user2].find(
                  (candidate) => (candidate || '').toLowerCase() !== sessionEmail
                )
              : undefined);
          const avatar = placeholderAvatar(name);
          const statusRaw =
            thread.kind === 'thread'
              ? thread.context?.type || 'active'
              : 'legacy conversation';
          const status = statusRaw.replace(/[-_]/g, ' ');

          return {
            id: `${thread.kind}:${thread.id}`,
            threadId: thread.id,
            name,
            email,
            avatar,
            status: status.charAt(0).toUpperCase() + status.slice(1),
            type: thread.kind,
            lastMessageSnippet: truncate(thread.lastMessageSnippet || ''),
            lastMessageAt: thread.lastMessageAt,
            unreadCount: thread.unreadCount,
            thread,
          };
        })
        .sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });
    },
    [currentSession]
  );

  const loadThreads = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}): Promise<ContactSummary[]> => {
      if (!silent) setLoading(true);
      try {
        const response = await api.get('/api/messages', { params: { limit: 100 } });
        const data = response.data;
        let normalized: ThreadSummary[] = [];
        if (Array.isArray(data?.items)) {
          normalized = data.items.map(normalizeNewThread);
        } else if (Array.isArray(data?.messages)) {
          normalized = normalizeLegacyThreads(data.messages);
        } else if (Array.isArray(data)) {
          normalized = normalizeLegacyThreads(data);
        }
        setThreads(normalized);
        const nextContacts = buildContacts(normalized);
        setContacts(nextContacts);
        return nextContacts;
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        if (!silent) {
          const message = error?.response?.data?.message || 'Failed to load messages';
          toast.error(message);
        }
        setThreads([]);
        setContacts([]);
        return [];
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [buildContacts]
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const selectContact = useCallback(
    async (contact: ContactSummary) => {
      setSelectedContact(contact);
      if (contact.type === 'thread') {
        try {
          const response = await api.get(`/api/messages/${contact.threadId}`);
          const threadData = response.data && response.data.id ? response.data : contact.thread.raw;
          const normalized = normalizeMessagesFromThread(threadData, contact.thread.context);
          setConversationMessages(normalized);
        } catch (error) {
          console.error('Error fetching thread conversation:', error);
          const fallback = normalizeMessagesFromThread(contact.thread.raw, contact.thread.context);
          setConversationMessages(fallback);
          toast.error('Unable to refresh conversation; showing cached messages.');
        }
      } else {
        const user1 = contact.thread.legacy?.user1;
        const user2 = contact.thread.legacy?.user2 || contact.email;
        if (!user1 || !user2) {
          setConversationMessages([]);
          return;
        }
        try {
          const response = await api.get('/api/messages/conversation', {
            params: { user1, user2, limit: 100 },
          });
          const rawConversation = Array.isArray(response.data?.conversation) ? response.data.conversation : [];
          const normalized = rawConversation
            .map(normalizeLegacyMessage)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setConversationMessages(normalized);
        } catch (error) {
          console.error('Error fetching legacy conversation:', error);
          toast.error('Unable to load conversation');
          const fallback = Array.isArray(contact.thread.raw)
            ? contact.thread.raw.map(normalizeLegacyMessage)
            : [];
          fallback.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setConversationMessages(fallback);
        }
      }
    },
    []
  );

  const handleSendMessage = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!selectedContact || !newMessage.trim() || sending) {
        return;
      }

      const content = newMessage.trim();
      setSending(true);
      try {
        if (selectedContact.type === 'thread') {
          await api.post('/api/messages/reply', {
            threadId: selectedContact.threadId,
            content,
          });
        } else {
          const recipient = selectedContact.email || selectedContact.thread.legacy?.user2;
          if (!recipient) {
            throw new Error('Missing recipient email');
          }
          const subject = selectedContact.thread.subject || `Message to ${selectedContact.name}`;
          await api.post('/api/messages', {
            to: recipient,
            subject,
            content,
            priority: 'normal',
          });
        }

        setNewMessage('');
        const nextContacts = await loadThreads({ silent: true });
        const refreshed = nextContacts.find(
          (contact) => contact.threadId === selectedContact.threadId && contact.type === selectedContact.type
        );
        if (refreshed) {
          await selectContact(refreshed);
        }
        toast.success('Message sent');
      } catch (error: any) {
        console.error('Error sending message:', error);
        const message = error?.response?.data?.message || error?.message || 'Failed to send message';
        toast.error(message);
      } finally {
        setSending(false);
      }
    },
    [selectedContact, newMessage, sending, loadThreads, selectContact]
  );

  const getLastMessageForContact = useCallback((contact: ContactSummary): ConversationMessage | null => {
    if (contact.type === 'thread') {
      const normalized = normalizeMessagesFromThread(contact.thread.raw, contact.thread.context);
      return normalized.length ? normalized[normalized.length - 1] : null;
    }
    if (Array.isArray(contact.thread.raw)) {
      const normalized = contact.thread.raw
        .map(normalizeLegacyMessage)
        .sort((a: ConversationMessage, b: ConversationMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return normalized.length ? normalized[normalized.length - 1] : null;
    }
    return null;
  }, []);

  const getUnreadCount = useCallback((contact: ContactSummary) => contact.unreadCount || 0, []);

  const currentUserAvatar = useMemo(
    () => placeholderAvatar(currentSession?.email || 'User'),
    [currentSession]
  );
  const currentUserName = useMemo(() => currentSession?.email || 'User', [currentSession]);
  const currentUserStatus = useMemo(() => currentSession?.role || 'member', [currentSession]);

  const isFromCurrentUser = useCallback(
    (message: ConversationMessage) => {
      const email = (currentSession?.email || '').toLowerCase();
      if (!email) return false;
      if (message.senderEmail && message.senderEmail.toLowerCase() === email) return true;
      if (message.senderId && message.senderId.toLowerCase().includes(email)) return true;
      if (message.senderRole?.toLowerCase() === 'admin' && currentSession?.role === 'admin') return true;
      return false;
    },
    [currentSession]
  );

  const formatTime = useCallback((timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
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
            <img src={currentUserAvatar} alt='Current user' />
          </div>
          <div className='info'>
            <h6 className='text-md mb-0'>{currentUserName}</h6>
            <p className='mb-0 text-capitalize'>{currentUserStatus}</p>
          </div>
          <div className='action d-flex flex-column align-items-end'>
            <button
              type='button'
              className='btn btn-primary btn-sm mb-2'
              onClick={() => setShowComposeModal(true)}
            >
              <Icon icon='mdi:plus' /> Compose
            </button>
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
            const lastMessage = getLastMessageForContact(contact);
            const unreadCount = getUnreadCount(contact);
            const lastSnippet = lastMessage ? truncate(lastMessage.content, 30) : 'No messages yet';
            const lastTimestamp = lastMessage ? formatTime(lastMessage.timestamp) : '';

            return (
              <div
                key={contact.id}
                className={`chat-sidebar-single ${selectedContact?.id === contact.id ? 'active' : ''}`}
                onClick={() => {
                  void selectContact(contact);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className='img'>
                  <img src={contact.avatar} alt={contact.name} />
                </div>
                <div className='info'>
                  <h6 className='text-sm mb-1'>{contact.name}</h6>
                  <p className='mb-0 text-xs'>{lastSnippet}</p>
                </div>
                <div className='action text-end'>
                  <p className='mb-0 text-neutral-400 text-xs lh-1'>{lastTimestamp}</p>
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
            {/* ...existing code for selected contact and messages... */}
            <div className='chat-sidebar-single active'>
              {/* ...existing code... */}
            </div>
            <div className='chat-message-list' style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {/* ...existing code... */}
            </div>
            <form className='chat-message-box' onSubmit={handleSendMessage}>
              {/* ...existing code... */}
            </form>
          </>
        ) : (
          <div className='d-flex flex-column align-items-center justify-content-center h-100 text-center'>
            <Icon icon='fluent:chat-48-regular' className='text-primary' style={{ fontSize: '4rem' }} />
            <h5 className='mt-3 mb-2'>Select a conversation</h5>
            <p className='text-muted'>Choose a contact from the sidebar to start messaging</p>
          </div>
        )}
        {/* Compose Message Modal */}
        {showComposeModal && (
          <div className='modal-backdrop show' style={{ zIndex: 1050 }}>
            <div className='modal d-block' tabIndex={-1} role='dialog' style={{ zIndex: 1060 }}>
              <div className='modal-dialog modal-dialog-centered' role='document'>
                <div className='modal-content'>
                  <div className='modal-header'>
                    <h5 className='modal-title'>Compose New Message</h5>
                    <button type='button' className='btn-close' aria-label='Close' onClick={() => setShowComposeModal(false)} />
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!composeRecipient.trim() || !composeContent.trim()) return;
                      setComposeSending(true);
                      try {
                        await api.post('/api/messages', {
                          to: composeRecipient.trim(),
                          subject: `Message from ${currentUserName}`,
                          content: composeContent.trim(),
                          priority: 'normal',
                        });
                        setComposeRecipient('');
                        setComposeContent('');
                        setShowComposeModal(false);
                        toast.success('Message sent');
                        await loadThreads({ silent: true });
                      } catch (error: any) {
                        toast.error(error?.response?.data?.message || 'Failed to send message');
                      } finally {
                        setComposeSending(false);
                      }
                    }}
                  >
                    <div className='modal-body'>
                      <div className='mb-3'>
                        <label className='form-label'>Recipient Email</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type='email'
                            className='form-control'
                            value={composeRecipient}
                            onChange={e => {
                              setComposeRecipient(e.target.value);
                              setRecipientQuery(e.target.value);
                              setRecipientDropdownOpen(true);
                            }}
                            onFocus={() => setRecipientDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setRecipientDropdownOpen(false), 150)}
                            autoComplete='off'
                            required
                          />
                          {recipientDropdownOpen && recipientQuery.trim() && (
                            <div style={{ position: 'absolute', zIndex: 100, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', maxHeight: 200, overflowY: 'auto', borderRadius: 4 }}>
                              {allContacts
                                .filter(c =>
                                  c.email && c.email.toLowerCase().includes(recipientQuery.toLowerCase()) ||
                                  c.name && c.name.toLowerCase().includes(recipientQuery.toLowerCase())
                                )
                                .slice(0, 10)
                                .map((c, idx) => (
                                  <div
                                    key={c.email + idx}
                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                    onMouseDown={() => {
                                      setComposeRecipient(c.email);
                                      setRecipientQuery(c.email);
                                      setRecipientDropdownOpen(false);
                                    }}
                                  >
                                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                                    <span style={{ color: '#888', marginLeft: 8 }}>{c.email}</span>
                                    <span style={{ color: '#aaa', marginLeft: 8, fontSize: '0.9em' }}>({c.role})</span>
                                  </div>
                                ))}
                              {allContacts.filter(c =>
                                c.email && c.email.toLowerCase().includes(recipientQuery.toLowerCase()) ||
                                c.name && c.name.toLowerCase().includes(recipientQuery.toLowerCase())
                              ).length === 0 && (
                                <div style={{ padding: '8px 12px', color: '#888' }}>No matches found</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className='mb-3'>
                        <label className='form-label'>Message</label>
                        <textarea
                          className='form-control'
                          rows={4}
                          value={composeContent}
                          onChange={(e) => setComposeContent(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className='modal-footer'>
                      <button type='button' className='btn btn-secondary' onClick={() => setShowComposeModal(false)}>
                        Cancel
                      </button>
                      <button type='submit' className='btn btn-primary' disabled={composeSending || !composeRecipient.trim() || !composeContent.trim()}>
                        {composeSending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 

export default MessagingSystem;
