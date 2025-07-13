import React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const ControlEdge: React.FC<EdgeProps> = ({
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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
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
          stroke: '#10b981',
          strokeWidth: 3,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 11,
            background: '#10b981',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 'bold',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          CONTROL
          {data?.condition && (
            <span style={{ marginLeft: '4px', fontSize: '10px' }}>
              {data.condition}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default ControlEdge;