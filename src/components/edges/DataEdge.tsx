import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const DataEdge: React.FC<EdgeProps> = ({
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
          stroke: '#3b82f6',
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 11,
            background: '#3b82f6',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 'bold',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          DATA
          {data?.dataType && (
            <span style={{ marginLeft: '4px', fontSize: '10px' }}>
              {data.dataType}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default DataEdge;