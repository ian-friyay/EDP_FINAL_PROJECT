import { useState } from 'react';
import { NavDropdown, Badge, Dropdown, Button } from 'react-bootstrap';

const initialNotifications = [
  {
    id: 1,
    title: 'New message received',
    description: 'Juan Cruz sent you a message.',
    timestamp: '2 minutes ago',
    read: false,
  },
  {
    id: 2,
    title: 'Booking accepted',
    description: 'Your booking has been accepted by Maria Santos.',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: 3,
    title: 'Transaction completed',
    description: 'Transaction #3 has been marked as completed.',
    timestamp: 'Yesterday',
    read: true,
  },
];

function NotificationsDropdown() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAsRead = (id) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true }))
    );
  };

  return (
    <NavDropdown
      id="notifications-dropdown"
      align="end"
      className="neu-notifications-dropdown"
      title={
        <span className="position-relative d-inline-block">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 16 16"
            role="img"
            aria-label="Notifications"
          >
            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
          </svg>
          {unreadCount > 0 && (
            <Badge
              pill
              bg="danger"
              className="position-absolute top-0 start-100 translate-middle"
              style={{ fontSize: '0.6rem' }}
            >
              {unreadCount}
            </Badge>
          )}
        </span>
      }
    >
      <Dropdown.Header className="d-flex justify-content-between align-items-center px-3 py-2">
        <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>Notifications</span>
        {unreadCount > 0 && (
          <Button
            variant="link"
            size="sm"
            className="p-0 text-decoration-none small"
            style={{ color: 'var(--neu-primary)' }}
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </Dropdown.Header>

      <Dropdown.Divider className="neu-divider mx-2" />

      {notifications.length === 0 ? (
        <Dropdown.ItemText className="text-muted text-center py-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="mb-2 d-block mx-auto opacity-50">
            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917z" />
          </svg>
          No notifications
        </Dropdown.ItemText>
      ) : (
        notifications.slice(0, 3).map((notification) => (
          <Dropdown.Item
            key={notification.id}
            onClick={() => markAsRead(notification.id)}
            className={`neu-notification-item ${!notification.read ? 'unread' : ''}`}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div className="text-truncate me-2" style={{ maxWidth: '240px' }}>
                <div className={notification.read ? 'text-muted' : 'fw-semibold'} style={{ color: notification.read ? undefined : 'var(--neu-text)' }}>
                  {notification.title}
                </div>
                <small className="text-muted d-block text-wrap" style={{ lineHeight: 1.3 }}>
                  {notification.description}
                </small>
                <small className="d-block mt-1" style={{ color: 'var(--neu-text-light)', fontSize: '0.72rem' }}>
                  {notification.timestamp}
                </small>
              </div>
              {!notification.read && (
                <span
                  className="rounded-circle flex-shrink-0 mt-1"
                  style={{
                    width: 8,
                    height: 8,
                    background: 'var(--neu-primary)',
                    display: 'inline-block',
                  }}
                />
              )}
            </div>
          </Dropdown.Item>
        ))
      )}
    </NavDropdown>
  );
}

export default NotificationsDropdown;
