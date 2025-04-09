import React from 'react';
import { Spinner } from 'react-bootstrap';

interface ProgressOverlayProps {
  isProcessing: boolean;
}

export const ProgressOverlay: React.FC<ProgressOverlayProps> = ({ isProcessing }) => {
  if (!isProcessing) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(196, 196, 196, 0.2)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
};
