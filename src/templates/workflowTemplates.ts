import { Node, Edge } from 'reactflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'api';
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'react-app',
    name: 'React Application',
    description: 'Basic React application workflow',
    category: 'frontend',
    nodes: [
      {
        id: 'app-component',
        type: 'component',
        position: { x: 100, y: 100 },
        data: {
          name: 'App Component',
          path: '/src/App.tsx',
          category: 'component',
          imports: ['react', 'react-router-dom'],
          exports: ['App']
        }
      },
      {
        id: 'main-entry',
        type: 'file',
        position: { x: 300, y: 100 },
        data: {
          name: 'Main Entry',
          path: '/src/main.tsx',
          category: 'file',
          imports: ['react', 'react-dom'],
          exports: []
        }
      },
      {
        id: 'router',
        type: 'component',
        position: { x: 100, y: 250 },
        data: {
          name: 'Router',
          path: '/src/Router.tsx',
          category: 'component',
          imports: ['react-router-dom'],
          exports: ['Router']
        }
      },
      {
        id: 'dashboard',
        type: 'component',
        position: { x: 300, y: 250 },
        data: {
          name: 'Dashboard',
          path: '/src/pages/Dashboard.tsx',
          category: 'component',
          imports: ['react'],
          exports: ['Dashboard']
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'main-entry',
        target: 'app-component',
        type: 'smoothstep'
      },
      {
        id: 'e2',
        source: 'app-component',
        target: 'router',
        type: 'smoothstep'
      },
      {
        id: 'e3',
        source: 'router',
        target: 'dashboard',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'express-api',
    name: 'Express API',
    description: 'REST API with Express.js',
    category: 'backend',
    nodes: [
      {
        id: 'server',
        type: 'api-node',
        position: { x: 100, y: 100 },
        data: {
          name: 'Express Server',
          path: '/server/index.js',
          category: 'server',
          imports: ['express', 'cors'],
          exports: ['app']
        }
      },
      {
        id: 'routes',
        type: 'api-node',
        position: { x: 300, y: 100 },
        data: {
          name: 'API Routes',
          path: '/server/routes/api.js',
          category: 'route',
          imports: ['express'],
          exports: ['router']
        }
      },
      {
        id: 'middleware',
        type: 'component',
        position: { x: 100, y: 250 },
        data: {
          name: 'Middleware',
          path: '/server/middleware/auth.js',
          category: 'middleware',
          imports: ['jsonwebtoken'],
          exports: ['authMiddleware']
        }
      },
      {
        id: 'database',
        type: 'component',
        position: { x: 300, y: 250 },
        data: {
          name: 'Database',
          path: '/server/db/connection.js',
          category: 'database',
          imports: ['mongodb'],
          exports: ['db']
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'server',
        target: 'routes',
        type: 'smoothstep'
      },
      {
        id: 'e2',
        source: 'server',
        target: 'middleware',
        type: 'smoothstep'
      },
      {
        id: 'e3',
        source: 'routes',
        target: 'database',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'fullstack-app',
    name: 'Full Stack Application',
    description: 'Complete full-stack application workflow',
    category: 'fullstack',
    nodes: [
      {
        id: 'frontend',
        type: 'component',
        position: { x: 100, y: 100 },
        data: {
          name: 'Frontend App',
          path: '/src/App.tsx',
          category: 'component',
          imports: ['react', 'axios'],
          exports: ['App']
        }
      },
      {
        id: 'backend',
        type: 'api-node',
        position: { x: 400, y: 100 },
        data: {
          name: 'Backend API',
          path: '/server/index.js',
          category: 'server',
          imports: ['express', 'cors'],
          exports: ['app']
        }
      },
      {
        id: 'components',
        type: 'component',
        position: { x: 100, y: 250 },
        data: {
          name: 'UI Components',
          path: '/src/components/',
          category: 'component',
          imports: ['react'],
          exports: ['Button', 'Modal', 'Form']
        }
      },
      {
        id: 'api-routes',
        type: 'api-node',
        position: { x: 400, y: 250 },
        data: {
          name: 'API Routes',
          path: '/server/routes/',
          category: 'route',
          imports: ['express'],
          exports: ['userRoutes', 'authRoutes']
        }
      },
      {
        id: 'database',
        type: 'component',
        position: { x: 250, y: 400 },
        data: {
          name: 'Database',
          path: '/server/db/',
          category: 'database',
          imports: ['mongodb'],
          exports: ['db']
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'frontend',
        target: 'backend',
        type: 'smoothstep',
        label: 'HTTP API'
      },
      {
        id: 'e2',
        source: 'frontend',
        target: 'components',
        type: 'smoothstep'
      },
      {
        id: 'e3',
        source: 'backend',
        target: 'api-routes',
        type: 'smoothstep'
      },
      {
        id: 'e4',
        source: 'api-routes',
        target: 'database',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    description: 'Microservices with API Gateway',
    category: 'backend',
    nodes: [
      {
        id: 'gateway',
        type: 'api-node',
        position: { x: 250, y: 50 },
        data: {
          name: 'API Gateway',
          path: '/gateway/index.js',
          category: 'gateway',
          imports: ['express', 'http-proxy-middleware'],
          exports: ['gateway']
        }
      },
      {
        id: 'user-service',
        type: 'api-node',
        position: { x: 100, y: 200 },
        data: {
          name: 'User Service',
          path: '/services/user/index.js',
          category: 'service',
          imports: ['express', 'mongodb'],
          exports: ['userService']
        }
      },
      {
        id: 'auth-service',
        type: 'api-node',
        position: { x: 400, y: 200 },
        data: {
          name: 'Auth Service',
          path: '/services/auth/index.js',
          category: 'service',
          imports: ['express', 'jsonwebtoken'],
          exports: ['authService']
        }
      },
      {
        id: 'notification-service',
        type: 'api-node',
        position: { x: 250, y: 350 },
        data: {
          name: 'Notification Service',
          path: '/services/notification/index.js',
          category: 'service',
          imports: ['express', 'nodemailer'],
          exports: ['notificationService']
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'gateway',
        target: 'user-service',
        type: 'smoothstep'
      },
      {
        id: 'e2',
        source: 'gateway',
        target: 'auth-service',
        type: 'smoothstep'
      },
      {
        id: 'e3',
        source: 'gateway',
        target: 'notification-service',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'react-native',
    name: 'React Native App',
    description: 'Mobile application with React Native',
    category: 'mobile',
    nodes: [
      {
        id: 'app-root',
        type: 'component',
        position: { x: 250, y: 50 },
        data: {
          name: 'App Root',
          path: '/App.tsx',
          category: 'component',
          imports: ['react-native', 'react-navigation'],
          exports: ['App']
        }
      },
      {
        id: 'navigation',
        type: 'component',
        position: { x: 100, y: 200 },
        data: {
          name: 'Navigation',
          path: '/src/navigation/AppNavigator.tsx',
          category: 'component',
          imports: ['react-navigation'],
          exports: ['AppNavigator']
        }
      },
      {
        id: 'screens',
        type: 'component',
        position: { x: 400, y: 200 },
        data: {
          name: 'Screens',
          path: '/src/screens/',
          category: 'component',
          imports: ['react-native'],
          exports: ['HomeScreen', 'ProfileScreen']
        }
      },
      {
        id: 'components',
        type: 'component',
        position: { x: 250, y: 350 },
        data: {
          name: 'UI Components',
          path: '/src/components/',
          category: 'component',
          imports: ['react-native'],
          exports: ['Button', 'Header', 'Card']
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'app-root',
        target: 'navigation',
        type: 'smoothstep'
      },
      {
        id: 'e2',
        source: 'navigation',
        target: 'screens',
        type: 'smoothstep'
      },
      {
        id: 'e3',
        source: 'screens',
        target: 'components',
        type: 'smoothstep'
      }
    ]
  }
];

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return workflowTemplates.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: WorkflowTemplate['category']): WorkflowTemplate[] => {
  return workflowTemplates.filter(template => template.category === category);
};

export const createEmptyWorkflow = (): { nodes: Node[], edges: Edge[] } => {
  return {
    nodes: [],
    edges: []
  };
};

export const createBasicWorkflow = (): { nodes: Node[], edges: Edge[] } => {
  return {
    nodes: [
      {
        id: 'start',
        type: 'file',
        position: { x: 100, y: 100 },
        data: {
          name: 'Start',
          path: '/src/index.ts',
          category: 'file',
          imports: [],
          exports: []
        }
      }
    ],
    edges: []
  };
};