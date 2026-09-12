const RevokedAccessModal = () => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Manrope, sans-serif',
      }}
    >
      <div
        style={{
          background: '#0d0d0d',
          border: '1px solid #ff3b3b',
          borderRadius: '12px',
          padding: '2.5rem 3rem',
          textAlign: 'center',
          maxWidth: '420px',
          boxShadow: '0 0 40px rgba(255, 59, 59, 0.25)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>&#9888;</div>
        <h2 style={{ color: '#ff3b3b', margin: 0, fontSize: '1.5rem', letterSpacing: '1px' }}>
          ACCESS DENIED
        </h2>
        <p style={{ color: '#aaa', marginTop: '1rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Your access has been revoked by the administrator. You no longer have permission to use
          this system.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          style={{
            marginTop: '1.5rem',
            padding: '0.6rem 1.8rem',
            background: '#ff3b3b',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default RevokedAccessModal;
