import express from 'express';
import { FileSystemService } from '../services/FileSystemService';
import { DependencyAnalyzer } from '../../core/analyzers/DependencyAnalyzer';
import { APIAnalyzer } from '../../core/analyzers/APIAnalyzer';
import { TranslationAnalyzer } from '../../core/analyzers/TranslationAnalyzer';
import { WebSocketAnalyzer } from '../../core/analyzers/WebSocketAnalyzer';
import { GraphQLAnalyzer } from '../../core/analyzers/GraphQLAnalyzer';
import { AIPromptGenerator } from '../../core/generators/AIPromptGenerator';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';
import { getErrorMessage } from '../../utils/errorUtils';
const ProjectService = require('../../../server/services/ProjectService');

const router = express.Router();
const fileSystemService = new FileSystemService();
const dependencyAnalyzer = new DependencyAnalyzer();
const apiAnalyzer = new APIAnalyzer();
const translationAnalyzer = new TranslationAnalyzer();
const webSocketAnalyzer = new WebSocketAnalyzer();
const graphQLAnalyzer = new GraphQLAnalyzer();
const aiPromptGenerator = new AIPromptGenerator();
const projectService = new ProjectService();

// 미들웨어 적용
router.use(authMiddleware);
router.use(rateLimitMiddleware);

/**
 * GET /api/projects
 * 프로젝트 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    const projects = await getStoredProjects();
    res.json({
      success: true,
      data: projects,
      total: projects.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '프로젝트 목록 조회 실패',
      details: getErrorMessage(error)
    });
  }
});

/**
 * POST /api/projects
 * 새 프로젝트 생성
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, rootPath } = req.body;

    if (!name || !rootPath) {
      return res.status(400).json({
        success: false,
        error: '프로젝트 이름과 루트 경로는 필수입니다'
      });
    }

    // 디렉토리 존재 확인
    const exists = await fileSystemService.exists(rootPath);
    if (!exists) {
      return res.status(400).json({
        success: false,
        error: '지정된 경로가 존재하지 않습니다'
      });
    }

    const project = {
      id: generateProjectId(),
      name,
      description: description || '',
      rootPath,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      settings: {
        excludePatterns: ['node_modules', '.git', 'dist', 'build'],
        includeHidden: false,
        maxDepth: 10
      }
    };

    await saveProject(project);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '프로젝트 생성 실패',
      details: getErrorMessage(error)
    });
  }
});

/**
 * GET /api/projects/:id
 * 특정 프로젝트 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await getProject(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: '프로젝트를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '프로젝트 조회 실패',
      details: getErrorMessage(error)
    });
  }
});

/**
 * PUT /api/projects/:id
 * 프로젝트 정보 업데이트
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const project = await getProject(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: '프로젝트를 찾을 수 없습니다'
      });
    }

    const updatedProject = {
      ...project,
      ...updates,
      lastModified: new Date().toISOString()
    };

    await saveProject(updatedProject);

    res.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '프로젝트 업데이트 실패',
      details: getErrorMessage(error)
    });
  }
});

/**
 * DELETE /api/projects/:id
 * 프로젝트 삭제
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteProject(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: '프로젝트를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '프로젝트가 삭제되었습니다'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '프로젝트 삭제 실패',
      details: getErrorMessage(error)
    });
  }
});

/**
 * POST /api/projects/:id/scan
 * 프로젝트 파일 스캔
 */
router.post('/:id/scan', async (req, res) => {
  try {
    const { id } = req.params;
    const { options = {} } = req.body;

    const project = await getProject(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: '프로젝트를 찾을 수 없습니다'
      });
    }

    // SSE를 위한 헤더 설정
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const sendProgress = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendProgress({ type: 'start', message: '파일 스캔 시작...' });

      const scanOptions = {
        ...project.settings,
        ...options,
        onProgress: (progress: any) => {
          sendProgress({ type: 'progress', ...progress });
        }
      };

      const fileTree = await fileSystemService.scanDirectory(project.rootPath, scanOptions);
      
      sendProgress({ type: 'complete', data: fileTree });
      res.end();

    } catch (error) {
      sendProgress({ type: 'error', error: getErrorMessage(error) });
      res.end();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '파일 스캔 실패',
      details: getErrorMessage(error)
    });
  }
});

/**
 * POST /api/projects/:id/analyze
 * 프로젝트 분석 실행
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const { analysisTypes = ['all'], filePaths = [] } = req.body;

    const project = await getProject(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: '프로젝트를 찾을 수 없습니다'
      });
    }

    // SSE를 위한 헤더 설정
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const sendProgress = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const results: any = {};

    try {
      sendProgress({ type: 'start', message: '분석 시작...' });

      // 의존성 분석
      if (analysisTypes.includes('all') || analysisTypes.includes('dependency')) {
        sendProgress({ type: 'progress', message: '의존성 분석 중...', current: 1, total: 5 });
        results.dependencies = await dependencyAnalyzer.analyze(filePaths);
      }

      // API 분석
      if (analysisTypes.includes('all') || analysisTypes.includes('api')) {
        sendProgress({ type: 'progress', message: 'API 분석 중...', current: 2, total: 5 });
        results.api = await apiAnalyzer.analyze(filePaths);
      }

      // 번역 분석
      if (analysisTypes.includes('all') || analysisTypes.includes('translation')) {
        sendProgress({ type: 'progress', message: '번역 분석 중...', current: 3, total: 5 });
        results.translation = await translationAnalyzer.analyze(filePaths);
      }

      // WebSocket 분석
      if (analysisTypes.includes('all') || analysisTypes.includes('websocket')) {
        sendProgress({ type: 'progress', message: 'WebSocket 분석 중...', current: 4, total: 5 });
        results.websocket = await webSocketAnalyzer.analyze(filePaths);
      }

      // GraphQL 분석
      if (analysisTypes.includes('all') || analysisTypes.includes('graphql')) {
        sendProgress({ type: 'progress', message: 'GraphQL 분석 중...', current: 5, total: 5 });
        results.graphql = await graphQLAnalyzer.analyze(filePaths);
      }

      sendProgress({ type: 'complete', data: results });
      res.end();

    } catch (error) {
      sendProgress({ type: 'error', error: getErrorMessage(error) });
      res.end();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '프로젝트 분석 실패',
      details: getErrorMessage(error)
    });
  }
});

/**
 * POST /api/projects/:id/ai-context
 * AI 컨텍스트 생성
 */
router.post('/:id/ai-context', async (req, res) => {
  try {
    const { id } = req.params;
    const { userIntent, nodes = [], edges = [], analysis = {} } = req.body;

    const project = await getProject(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: '프로젝트를 찾을 수 없습니다'
      });
    }

    const projectContext = aiPromptGenerator.generateProjectContext(
      nodes,
      edges,
      analysis,
      {
        name: project.name,
        description: project.description
      }
    );

    const aiPrompt = aiPromptGenerator.generateAIPrompt(
      projectContext,
      analysis,
      userIntent || '코드 개선 제안',
      {
        includeCodeExamples: true,
        includeErrorContext: true,
        maxLength: 5000
      }
    );

    res.json({
      success: true,
      data: {
        context: projectContext,
        prompt: aiPrompt,
        documentation: aiPromptGenerator.generateCodeImprovementContext(
          projectContext,
          analysis
        )
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'AI 컨텍스트 생성 실패',
      details: getErrorMessage(error)
    });
  }
});

/**
 * POST /api/projects/:id/workflow
 * 프로젝트 워크플로우 저장
 */
router.post('/:id/workflow', async (req, res) => {
  try {
    const { id } = req.params;
    const { nodes, edges, analysis } = req.body;

    const project = await getProject(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: '프로젝트를 찾을 수 없습니다'
      });
    }

    const workflow = {
      nodes: nodes || [],
      edges: edges || [],
      analysis: analysis || {},
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };

    await projectService.saveProjectWorkflow(id, workflow);

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '워크플로우 저장 실패',
      details: getErrorMessage(error)
    });
  }
});

/**
 * GET /api/projects/:id/export
 * 프로젝트 워크플로우 내보내기
 */
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    const project = await getProject(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: '프로젝트를 찾을 수 없습니다'
      });
    }

    const workflow = await getProjectWorkflow(id);
    
    switch (format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name}-workflow.json"`);
        res.json(workflow);
        break;
      
      case 'markdown':
        const markdown = generateMarkdownReport(workflow);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name}-report.md"`);
        res.send(markdown);
        break;
      
      default:
        res.status(400).json({
          success: false,
          error: '지원하지 않는 형식입니다'
        });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '내보내기 실패',
      details: getErrorMessage(error)
    });
  }
});

// Helper functions
async function getStoredProjects(): Promise<any[]> {
  return projectService.getStoredProjects();
}

async function getProject(id: string): Promise<any | null> {
  return projectService.getProject(id);
}

async function saveProject(project: any): Promise<void> {
  return projectService.saveProject(project);
}

async function deleteProject(id: string): Promise<boolean> {
  return projectService.deleteProject(id);
}

async function getProjectWorkflow(id: string): Promise<any> {
  return projectService.getProjectWorkflow(id);
}

function generateProjectId(): string {
  return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateMarkdownReport(workflow: any): string {
  let report = `# 워크플로우 분석 리포트\n\n`;
  report += `생성일시: ${new Date().toLocaleString()}\n\n`;
  
  if (workflow.nodes) {
    report += `## 노드 현황\n`;
    report += `총 노드 수: ${workflow.nodes.length}\n\n`;
  }
  
  if (workflow.edges) {
    report += `## 연결 현황\n`;
    report += `총 연결 수: ${workflow.edges.length}\n\n`;
  }
  
  return report;
}

export default router;