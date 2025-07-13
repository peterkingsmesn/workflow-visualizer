import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const APIEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#f59e0b',
          strokeWidth: 2,
          strokeDasharray: '5 5',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 11,
            background: '#f59e0b',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 'bold',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          API
          {data?.method && (
            <span style={{ marginLeft: '4px', fontSize: '10px' }}>
              {data.method}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default APIEdge;