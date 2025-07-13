import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const EventEdge: React.FC<EdgeProps> = ({
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
          stroke: '#8b5cf6',
          strokeWidth: 2,
          strokeDasharray: '10 5',
          animation: 'dash 1s linear infinite',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 11,
            background: '#8b5cf6',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 'bold',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          EVENT
          {data?.eventName && (
            <span style={{ marginLeft: '4px', fontSize: '10px' }}>
              {data.eventName}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -15;
          }
        }
      `}</style>
    </>
  );
};

export default EventEdge;