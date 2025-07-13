import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Globe, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { TranslationData } from '../../types/workflow.types';

interface TranslationNodeProps {
  data: TranslationData;
  selected: boolean;
}

const TranslationNode: React.FC<TranslationNodeProps> = ({ data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAddKey = useCallback(() => {
    if (newKey.trim()) {
      const updatedKeys = [...data.keys, {
        id: Date.now().toString(),
        key: newKey.trim(),
        translations: {}
      }];
      
      // 실제로는 워크플로우 스토어를 통해 업데이트
      // updateNode(nodeId, { ...data, keys: updatedKeys });
      
      setNewKey('');
      setIsEditing(false);
    }
  }, [newKey, data.keys]);

  const handleUpdateTranslation = useCallback((keyId: string, language: string, value: string) => {
    const updatedKeys = data.keys.map(key => {
      if (key.id === keyId) {
        return {
          ...key,
          translations: {
            ...key.translations,
            [language]: value
          }
        };
      }
      return key;
    });
    
    // 실제로는 워크플로우 스토어를 통해 업데이트
    // updateNode(nodeId, { ...data, keys: updatedKeys });
  }, [data.keys]);

  const handleRemoveKey = useCallback((keyId: string) => {
    const updatedKeys = data.keys.filter(key => key.id !== keyId);
    // updateNode(nodeId, { ...data, keys: updatedKeys });
  }, [data.keys]);

  const getCoverageStats = () => {
    const totalKeys = data.keys.length;
    const totalTranslations = totalKeys * data.languages.length;
    const completedTranslations = data.keys.reduce((count, key) => {
      return count + Object.keys(key.translations).length;
    }, 0);
    
    return {
      total: totalKeys,
      completed: completedTranslations,
      percentage: totalTranslations > 0 ? Math.round((completedTranslations / totalTranslations) * 100) : 0
    };
  };

  const getKeyStatus = (key: any) => {
    const translatedLanguages = Object.keys(key.translations);
    const missingLanguages = data.languages.filter(lang => !translatedLanguages.includes(lang));
    
    if (missingLanguages.length === 0) {
      return 'complete';
    } else if (translatedLanguages.length === 0) {
      return 'missing';
    } else {
      return 'partial';
    }
  };

  const stats = getCoverageStats();

  return (
    <div className={`translation-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ left: -8 }}
      />
      
      <div className="node-header">
        <div className="node-icon">
          <Globe size={16} />
        </div>
        <div className="node-title">
          <h3>{data.name}</h3>
          <span className="node-type">번역</span>
        </div>
      </div>

      <div className="translation-stats">
        <div className="stat-item">
          <span className="stat-label">키 개수:</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">완성도:</span>
          <span className="stat-value">{stats.percentage}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">언어:</span>
          <span className="stat-value">{data.languages.join(', ')}</span>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${stats.percentage}%` }}
        />
      </div>

      <div className="translation-keys">
        {data.keys.slice(0, 5).map(key => {
          const status = getKeyStatus(key);
          const StatusIcon = status === 'complete' ? CheckCircle : 
                           status === 'partial' ? AlertCircle : X;
          
          return (
            <div key={key.id} className={`key-item ${status}`}>
              <div className="key-header">
                <StatusIcon size={14} />
                <span className="key-name">{key.key}</span>
              </div>
              
              {editingKey === key.id ? (
                <div className="key-editor">
                  {data.languages.map(lang => (
                    <div key={lang} className="translation-input">
                      <label>{lang}:</label>
                      <input
                        type="text"
                        value={key.translations[lang] || ''}
                        onChange={(e) => handleUpdateTranslation(key.id, lang, e.target.value)}
                        placeholder={`Translation for ${lang}`}
                      />
                    </div>
                  ))}
                  <div className="editor-actions">
                    <button onClick={() => setEditingKey(null)}>취소</button>
                    <button onClick={() => setEditingKey(null)}>저장</button>
                  </div>
                </div>
              ) : (
                <div className="key-preview">
                  {data.languages.map(lang => (
                    <div key={lang} className="translation-preview">
                      <span className="lang-code">{lang}:</span>
                      <span className="translation-text">
                        {key.translations[lang] || '(번역 없음)'}
                      </span>
                    </div>
                  ))}
                  <button 
                    className="edit-button"
                    onClick={() => setEditingKey(key.id)}
                  >
                    편집
                  </button>
                </div>
              )}
            </div>
          );
        })}
        
        {data.keys.length > 5 && (
          <div className="more-keys">
            +{data.keys.length - 5} 개 더...
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="add-key-form">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="새 번역 키"
            onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
          />
          <div className="form-actions">
            <button onClick={() => setIsEditing(false)}>취소</button>
            <button onClick={handleAddKey}>추가</button>
          </div>
        </div>
      ) : (
        <button 
          className="add-key-button"
          onClick={() => setIsEditing(true)}
        >
          <Plus size={14} />
          키 추가
        </button>
      )}

      <div className="node-actions">
        <button className="action-button" title="번역 내보내기">
          내보내기
        </button>
        <button className="action-button" title="번역 가져오기">
          가져오기
        </button>
        <button className="action-button" title="미번역 찾기">
          검사
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ right: -8 }}
      />
    </div>
  );
};

export default TranslationNode;