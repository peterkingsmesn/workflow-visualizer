const fs = require('fs').promises;
const path = require('path');
const CONFIG = require('../config/constants');

class ProjectService {
  constructor() {
    this.projectsDir = path.join(__dirname, '../../data/projects');
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.projectsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create projects directory:', error);
    }
  }

  async getStoredProjects() {
    try {
      const files = await fs.readdir(this.projectsDir);
      const projects = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.projectsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const project = JSON.parse(content);
          projects.push(project);
        }
      }

      return projects.sort((a, b) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
    } catch (error) {
      console.error('Error reading projects:', error);
      return [];
    }
  }

  async getProject(id) {
    try {
      const filePath = path.join(this.projectsDir, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async saveProject(project) {
    try {
      const filePath = path.join(this.projectsDir, `${project.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');
      
      // 워크플로우 디렉토리도 생성
      const workflowDir = path.join(this.projectsDir, project.id, 'workflows');
      await fs.mkdir(workflowDir, { recursive: true });
      
      return project;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  async deleteProject(id) {
    try {
      const filePath = path.join(this.projectsDir, `${id}.json`);
      
      // 프로젝트 파일 존재 확인
      try {
        await fs.access(filePath);
      } catch {
        return false;
      }

      // 프로젝트 파일 삭제
      await fs.unlink(filePath);
      
      // 프로젝트 관련 데이터 디렉토리 삭제
      const projectDataDir = path.join(this.projectsDir, id);
      try {
        await fs.rm(projectDataDir, { recursive: true, force: true });
      } catch (error) {
        // 디렉토리가 없을 수 있으므로 에러 무시
      }

      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async getProjectWorkflow(id) {
    try {
      const workflowPath = path.join(this.projectsDir, id, 'workflows', 'latest.json');
      const content = await fs.readFile(workflowPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // 워크플로우가 없으면 빈 객체 반환
      return {
        nodes: [],
        edges: [],
        analysis: {},
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };
    }
  }

  async saveProjectWorkflow(id, workflow) {
    try {
      const workflowDir = path.join(this.projectsDir, id, 'workflows');
      await fs.mkdir(workflowDir, { recursive: true });
      
      // 최신 워크플로우 저장
      const latestPath = path.join(workflowDir, 'latest.json');
      await fs.writeFile(latestPath, JSON.stringify(workflow, null, 2), 'utf-8');
      
      // 버전별 백업 저장
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupPath = path.join(workflowDir, `workflow-${timestamp}.json`);
      await fs.writeFile(backupPath, JSON.stringify(workflow, null, 2), 'utf-8');
      
      // 프로젝트의 lastModified 업데이트
      const project = await this.getProject(id);
      if (project) {
        project.lastModified = new Date().toISOString();
        await this.saveProject(project);
      }
      
      return workflow;
    } catch (error) {
      console.error('Error saving workflow:', error);
      throw error;
    }
  }

  async getProjectAnalysis(id) {
    try {
      const analysisPath = path.join(this.projectsDir, id, 'analysis', 'latest.json');
      const content = await fs.readFile(analysisPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async saveProjectAnalysis(id, analysis) {
    try {
      const analysisDir = path.join(this.projectsDir, id, 'analysis');
      await fs.mkdir(analysisDir, { recursive: true });
      
      const latestPath = path.join(analysisDir, 'latest.json');
      await fs.writeFile(latestPath, JSON.stringify(analysis, null, 2), 'utf-8');
      
      return analysis;
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }
}

module.exports = ProjectService;