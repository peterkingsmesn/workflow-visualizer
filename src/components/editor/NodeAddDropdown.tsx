import React from 'react';
import { Plus } from 'lucide-react';

interface NodeAddDropdownProps {
  onAddNode: (type: string) => void;
}

export const NodeAddDropdown: React.FC<NodeAddDropdownProps> = ({ onAddNode }) => {
  const styles = {
    dropdown: {
      position: 'relative' as const,
      display: 'inline-block'
    },
    dropdownButton: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: 'linear-gradient(45deg, #10b981, #059669)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    dropdownContent: {
      display: 'none',
      position: 'absolute' as const,
      background: 'rgba(26, 26, 46, 0.95)',
      backdropFilter: 'blur(20px)',
      minWidth: '160px',
      boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      zIndex: 1,
      marginTop: '5px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    dropdownItem: {
      color: 'white',
      padding: '12px 16px',
      textDecoration: 'none',
      display: 'block',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      background: 'transparent',
      border: 'none',
      width: '100%',
      textAlign: 'left' as const,
      fontSize: '14px'
    }
  };

  return (
    <div style={styles.dropdown} 
      onMouseEnter={(e) => {
        const content = e.currentTarget.querySelector('.dropdown-content') as HTMLElement;
        if (content) content.style.display = 'block';
      }}
      onMouseLeave={(e) => {
        const content = e.currentTarget.querySelector('.dropdown-content') as HTMLElement;
        if (content) content.style.display = 'none';
      }}
    >
      <button style={styles.dropdownButton}>
        <Plus size={16} />
        노드 추가
      </button>
      <div className="dropdown-content" style={styles.dropdownContent}>
        <button style={styles.dropdownItem} 
          onClick={() => onAddNode('api')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >API 노드</button>
        <button style={styles.dropdownItem}
          onClick={() => onAddNode('function')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >함수 노드</button>
        <button style={styles.dropdownItem}
          onClick={() => onAddNode('translation')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >번역 노드</button>
      </div>
    </div>
  );
};