import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Database, Play, Book, Edit, Layers, AlertCircle } from 'lucide-react';
import { GraphQLData } from '../../types/workflow.types';

interface GraphQLNodeProps {
  data: GraphQLData;
  selected: boolean;
}

const GraphQLNode: React.FC<GraphQLNodeProps> = ({ data, selected }) => {
  const [activeTab, setActiveTab] = useState<'queries' | 'mutations' | 'subscriptions' | 'types'>('queries');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecuteQuery = useCallback(async (query: string) => {
    setIsExecuting(true);
    try {
      // 실제 GraphQL 쿼리 실행 로직
      console.log('Executing query:', query);
      // await executeGraphQLQuery(query);
    } catch (error) {
      console.error('Query execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const getItemCount = (type: string) => {
    switch (type) {
      case 'queries':
        return data.queries?.length || 0;
      case 'mutations':
        return data.mutations?.length || 0;
      case 'subscriptions':
        return data.subscriptions?.length || 0;
      case 'types':
        return data.types?.length || 0;
      default:
        return 0;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'queries':
        return (
          <div className="graphql-items">
            {data.queries?.slice(0, 5).map((query, index) => (
              <div key={index} className="graphql-item query">
                <div className="item-header">
                  <Database size={14} />
                  <span className="item-name">{query}</span>
                </div>
                <div className="item-actions">
                  <button 
                    className="action-btn"
                    onClick={() => handleExecuteQuery(query)}
                    disabled={isExecuting}
                  >
                    <Play size={12} />
                  </button>
                  <button className="action-btn">
                    <Book size={12} />
                  </button>
                </div>
              </div>
            )) || <div className="no-items">쿼리 없음</div>}
          </div>
        );
      
      case 'mutations':
        return (
          <div className="graphql-items">
            {data.mutations?.slice(0, 5).map((mutation, index) => (
              <div key={index} className="graphql-item mutation">
                <div className="item-header">
                  <Edit size={14} />
                  <span className="item-name">{mutation}</span>
                </div>
                <div className="item-actions">
                  <button 
                    className="action-btn"
                    onClick={() => handleExecuteQuery(mutation)}
                    disabled={isExecuting}
                  >
                    <Play size={12} />
                  </button>
                  <button className="action-btn">
                    <Book size={12} />
                  </button>
                </div>
              </div>
            )) || <div className="no-items">뮤테이션 없음</div>}
          </div>
        );
      
      case 'subscriptions':
        return (
          <div className="graphql-items">
            {data.subscriptions?.slice(0, 5).map((subscription, index) => (
              <div key={index} className="graphql-item subscription">
                <div className="item-header">
                  <Layers size={14} />
                  <span className="item-name">{subscription}</span>
                </div>
                <div className="item-actions">
                  <button 
                    className="action-btn"
                    onClick={() => handleExecuteQuery(subscription)}
                    disabled={isExecuting}
                  >
                    <Play size={12} />
                  </button>
                  <button className="action-btn">
                    <Book size={12} />
                  </button>
                </div>
              </div>
            )) || <div className="no-items">서브스크립션 없음</div>}
          </div>
        );
      
      case 'types':
        return (
          <div className="graphql-items">
            {data.types?.slice(0, 5).map((type, index) => (
              <div key={index} className="graphql-item type">
                <div className="item-header">
                  <div className={`type-badge ${type.kind?.toLowerCase()}`}>
                    {type.kind}
                  </div>
                  <span className="item-name">{type.name}</span>
                </div>
                <div className="type-info">
                  {type.fields && (
                    <span className="field-count">{type.fields.length} fields</span>
                  )}
                  {type.enumValues && (
                    <span className="enum-count">{type.enumValues.length} values</span>
                  )}
                </div>
              </div>
            )) || <div className="no-items">타입 없음</div>}
          </div>
        );
      
      default:
        return null;
    }
  };

  const totalItems = getItemCount('queries') + getItemCount('mutations') + 
                   getItemCount('subscriptions') + getItemCount('types');

  return (
    <div className={`graphql-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ left: -8 }}
      />
      
      <div className="node-header">
        <div className="node-icon">
          <Database size={16} />
        </div>
        <div className="node-title">
          <h3>{data.name}</h3>
          <span className="node-type">GraphQL</span>
        </div>
      </div>

      <div className="graphql-info">
        <div className="info-item">
          <span className="info-label">스키마:</span>
          <span className="info-value">{data.schemaPath || 'N/A'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">엔드포인트:</span>
          <span className="info-value">{data.endpoint || '/graphql'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">총 항목:</span>
          <span className="info-value">{totalItems}</span>
        </div>
      </div>

      <div className="graphql-tabs">
        <button 
          className={`tab ${activeTab === 'queries' ? 'active' : ''}`}
          onClick={() => setActiveTab('queries')}
        >
          <Database size={12} />
          쿼리 ({getItemCount('queries')})
        </button>
        <button 
          className={`tab ${activeTab === 'mutations' ? 'active' : ''}`}
          onClick={() => setActiveTab('mutations')}
        >
          <Edit size={12} />
          뮤테이션 ({getItemCount('mutations')})
        </button>
        <button 
          className={`tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <Layers size={12} />
          서브스크립션 ({getItemCount('subscriptions')})
        </button>
        <button 
          className={`tab ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => setActiveTab('types')}
        >
          <Book size={12} />
          타입 ({getItemCount('types')})
        </button>
      </div>

      <div className="graphql-content">
        {renderTabContent()}
      </div>

      {data.errors && data.errors.length > 0 && (
        <div className="graphql-errors">
          <div className="error-header">
            <AlertCircle size={14} />
            <span>오류 ({data.errors.length})</span>
          </div>
          <div className="error-list">
            {data.errors.slice(0, 3).map((error, index) => (
              <div key={index} className="error-item">
                <span className="error-message">{error.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="node-actions">
        <button 
          className="action-button"
          disabled={isExecuting}
        >
          <Play size={14} />
          {isExecuting ? '실행 중...' : '쿼리 실행'}
        </button>
        <button className="action-button">
          <Book size={14} />
          스키마 보기
        </button>
        <button className="action-button">
          <Edit size={14} />
          플레이그라운드
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ right: -8 }}
      />
      
      {/* 쿼리별 핸들 */}
      {data.queries?.slice(0, 3).map((query, index) => (
        <Handle
          key={`query-${index}`}
          type="source"
          position={Position.Right}
          id={`query-${query}`}
          style={{ 
            right: -8,
            top: 120 + (index * 20)
          }}
        />
      ))}
      
      {/* 뮤테이션별 핸들 */}
      {data.mutations?.slice(0, 3).map((mutation, index) => (
        <Handle
          key={`mutation-${index}`}
          type="source"
          position={Position.Right}
          id={`mutation-${mutation}`}
          style={{ 
            right: -8,
            top: 180 + (index * 20)
          }}
        />
      ))}
    </div>
  );
};

export default GraphQLNode;