'use client';

export default function OfflinePage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>You&apos;re Offline</h1>
      <p style={{ color: 'var(--muted-foreground)', maxWidth: '400px' }}>
        It looks like you&apos;ve lost your internet connection. Please check your connection and try
        again.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
