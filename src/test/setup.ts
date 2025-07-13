// Jest 테스트 환경 설정
import '@testing-library/jest-dom';

// React Flow 모킹
jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  ReactFlow: ({ children }: any) => ({ 
    type: 'div', 
    props: { 'data-testid': 'react-flow', children } 
  }),
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  useReactFlow: () => ({
    project: jest.fn(),
    fitView: jest.fn(),
    getNodes: jest.fn(() => []),
    getEdges: jest.fn(() => []),
  }),
  Controls: () => ({ type: 'div', props: { 'data-testid': 'controls' } }),
  MiniMap: () => ({ type: 'div', props: { 'data-testid': 'minimap' } }),
  Background: () => ({ type: 'div', props: { 'data-testid': 'background' } }),
  Handle: () => ({ type: 'div', props: { 'data-testid': 'handle' } }),
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
}));

// Socket.IO 모킹
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
  })),
}));

// 전역 fetch 모킹
global.fetch = jest.fn();

// LocalStorage 모킹
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// URL.createObjectURL 모킹
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Worker 모킹
class WorkerMock {
  postMessage = jest.fn();
  terminate = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}
global.Worker = WorkerMock as any;

// ResizeObserver 모킹
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// IntersectionObserver 모킹
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// 환경 변수 설정
process.env.REACT_APP_API_URL = 'http://localhost:3001';
process.env.REACT_APP_WEBSOCKET_URL = 'ws://localhost:3001';