const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Ensure exports directory exists
const ensureExportsDir = async () => {
  const exportsDir = path.join(__dirname, '../../exports');
  try {
    await fs.access(exportsDir);
  } catch {
    await fs.mkdir(exportsDir, { recursive: true });
  }
  return exportsDir;
};

// 워크플로우를 이미지로 내보내기
router.post('/image', async (req, res) => {
  try {
    const { workflow, format = 'png', width = 1200, height = 800 } = req.body;
    
    if (!workflow) {
      return res.status(400).json({
        success: false,
        error: 'Workflow data is required'
      });
    }
    
    const exportsDir = await ensureExportsDir();
    const filename = `workflow-${uuidv4()}.${format}`;
    const filepath = path.join(exportsDir, filename);
    
    // Create HTML for rendering
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://unpkg.com/reactflow@11.10.1/dist/umd/index.js"></script>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .workflow-container { width: ${width}px; height: ${height}px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="workflow-container" id="workflow"></div>
        <script>
          // Render workflow data
          const workflowData = ${JSON.stringify(workflow)};
          // Simple rendering logic here
          document.getElementById('workflow').innerHTML = 
            '<div style="padding: 20px;">Workflow: ' + workflowData.name + '</div>';
        </script>
      </body>
      </html>
    `;
    
    // Use puppeteer to generate image
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
    await page.setViewport({ width, height });
    
    if (format === 'pdf') {
      await page.pdf({ 
        path: filepath, 
        width: `${width}px`, 
        height: `${height}px`,
        printBackground: true
      });
    } else {
      await page.screenshot({ 
        path: filepath, 
        fullPage: false,
        clip: { x: 0, y: 0, width, height }
      });
    }
    
    await browser.close();
    
    res.json({
      success: true,
      filename,
      url: `/api/export/download/${filename}`,
      format,
      size: { width, height }
    });
    
  } catch (error) {
    console.error('Image export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate image'
    });
  }
});

// 워크플로우를 JSON으로 내보내기  
router.post('/json', async (req, res) => {
  try {
    const { workflow, pretty = true } = req.body;
    
    if (!workflow) {
      return res.status(400).json({
        success: false,
        error: 'Workflow data is required'
      });
    }
    
    const exportsDir = await ensureExportsDir();
    const filename = `workflow-${uuidv4()}.json`;
    const filepath = path.join(exportsDir, filename);
    
    // Add metadata
    const exportData = {
      ...workflow,
      metadata: {
        ...workflow.metadata,
        exportedAt: new Date().toISOString(),
        exportedBy: req.body.userId || 'anonymous',
        version: '1.0'
      }
    };
    
    const jsonContent = pretty 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
    
    await fs.writeFile(filepath, jsonContent, 'utf8');
    
    res.json({
      success: true,
      filename,
      url: `/api/export/download/${filename}`,
      size: Buffer.byteLength(jsonContent, 'utf8')
    });
    
  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export JSON'
    });
  }
});

// 워크플로우를 코드로 내보내기
router.post('/code', async (req, res) => {
  try {
    const { workflow, language = 'javascript', framework = 'react' } = req.body;
    
    if (!workflow) {
      return res.status(400).json({
        success: false,
        error: 'Workflow data is required'
      });
    }
    
    const exportsDir = await ensureExportsDir();
    const extension = language === 'typescript' ? 'ts' : 'js';
    const filename = `workflow-${uuidv4()}.${extension}`;
    const filepath = path.join(exportsDir, filename);
    
    let code = '';
    
    if (framework === 'react') {
      code = generateReactCode(workflow, language === 'typescript');
    } else if (framework === 'vue') {
      code = generateVueCode(workflow);
    } else if (framework === 'angular') {
      code = generateAngularCode(workflow);
    } else {
      code = generateVanillaCode(workflow, language);
    }
    
    await fs.writeFile(filepath, code, 'utf8');
    
    res.json({
      success: true,
      filename,
      url: `/api/export/download/${filename}`,
      language,
      framework,
      size: Buffer.byteLength(code, 'utf8')
    });
    
  } catch (error) {
    console.error('Code export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate code'
    });
  }
});

// 파일 다운로드
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const exportsDir = await ensureExportsDir();
    const filepath = path.join(exportsDir, filename);
    
    // Security check
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }
    
    await fs.access(filepath);
    
    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.json': 'application/json',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.pdf': 'application/pdf'
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = require('fs').createReadStream(filepath);
    fileStream.pipe(res);
    
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
});

// 내보내기 목록
router.get('/list', async (req, res) => {
  try {
    const exportsDir = await ensureExportsDir();
    const files = await fs.readdir(exportsDir);
    
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const filepath = path.join(exportsDir, filename);
        const stats = await fs.stat(filepath);
        return {
          filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: `/api/export/download/${filename}`
        };
      })
    );
    
    res.json({
      success: true,
      files: fileList.sort((a, b) => b.created - a.created)
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list exports'
    });
  }
});

// Code generation functions
function generateReactCode(workflow, useTypeScript = false) {
  const imports = useTypeScript 
    ? `import React from 'react';\nimport { Node, Edge } from 'reactflow';\n\n`
    : `import React from 'react';\n\n`;
    
  const interfaceCode = useTypeScript 
    ? `interface WorkflowProps {\n  nodes: Node[];\n  edges: Edge[];\n}\n\n`
    : '';
    
  const componentCode = useTypeScript
    ? `const WorkflowComponent: React.FC<WorkflowProps> = ({ nodes, edges }) => {`
    : `const WorkflowComponent = ({ nodes, edges }) => {`;
    
  return `${imports}${interfaceCode}${componentCode}
  return (
    <div className="workflow-container">
      <h2>${workflow.name || 'Generated Workflow'}</h2>
      <div className="nodes">
        {nodes.map(node => (
          <div key={node.id} className="node">
            {node.data.label || node.id}
          </div>
        ))}
      </div>
    </div>
  );
};

// Initial data
const initialNodes = ${JSON.stringify(workflow.nodes || [], null, 2)};
const initialEdges = ${JSON.stringify(workflow.edges || [], null, 2)};

export default function App() {
  return <WorkflowComponent nodes={initialNodes} edges={initialEdges} />;
}`;
}

function generateVueCode(workflow) {
  return `<template>
  <div class="workflow-container">
    <h2>${workflow.name || 'Generated Workflow'}</h2>
    <div class="nodes">
      <div v-for="node in nodes" :key="node.id" class="node">
        {{ node.data.label || node.id }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkflowComponent',
  data() {
    return {
      nodes: ${JSON.stringify(workflow.nodes || [], null, 6)},
      edges: ${JSON.stringify(workflow.edges || [], null, 6)}
    };
  }
};
</script>

<style scoped>
.workflow-container {
  padding: 20px;
}
.node {
  margin: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>`;
}

function generateAngularCode(workflow) {
  return `import { Component } from '@angular/core';

interface Node {
  id: string;
  data: { label?: string };
  position: { x: number; y: number };
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

@Component({
  selector: 'app-workflow',
  template: \`
    <div class="workflow-container">
      <h2>${workflow.name || 'Generated Workflow'}</h2>
      <div class="nodes">
        <div *ngFor="let node of nodes" class="node">
          {{ node.data.label || node.id }}
        </div>
      </div>
    </div>
  \`,
  styles: [\`
    .workflow-container { padding: 20px; }
    .node { margin: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
  \`]
})
export class WorkflowComponent {
  nodes: Node[] = ${JSON.stringify(workflow.nodes || [], null, 2)};
  edges: Edge[] = ${JSON.stringify(workflow.edges || [], null, 2)};
}`;
}

function generateVanillaCode(workflow, language) {
  const isTS = language === 'typescript';
  return `${isTS ? '// TypeScript\n' : '// JavaScript\n'}
${isTS ? 'interface Node {\n  id: string;\n  data: { label?: string };\n  position: { x: number; y: number };\n}\n\n' : ''}
${isTS ? 'interface Edge {\n  id: string;\n  source: string;\n  target: string;\n}\n\n' : ''}
class WorkflowRenderer {
  ${isTS ? 'private ' : ''}nodes${isTS ? ': Node[]' : ''};
  ${isTS ? 'private ' : ''}edges${isTS ? ': Edge[]' : ''};
  
  constructor(nodes${isTS ? ': Node[]' : ''}, edges${isTS ? ': Edge[]' : ''}) {
    this.nodes = nodes;
    this.edges = edges;
  }
  
  render(container${isTS ? ': HTMLElement' : ''})${isTS ? ': void' : ''} {
    container.innerHTML = \`
      <div class="workflow-container">
        <h2>${workflow.name || 'Generated Workflow'}</h2>
        <div class="nodes">
          \${this.nodes.map(node => \`
            <div class="node" data-id="\${node.id}">
              \${node.data.label || node.id}
            </div>
          \`).join('')}
        </div>
      </div>
    \`;
  }
}

// Usage
const nodes = ${JSON.stringify(workflow.nodes || [], null, 2)};
const edges = ${JSON.stringify(workflow.edges || [], null, 2)};
const renderer = new WorkflowRenderer(nodes, edges);

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('workflow-container');
  if (container) {
    renderer.render(container);
  }
});`;
}

module.exports = router;