const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 워크플로우 저장 디렉토리
const WORKFLOWS_DIR = path.join(__dirname, '../../data/workflows');

// 디렉토리 생성
(async () => {
  try {
    await fs.mkdir(WORKFLOWS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create workflows directory:', error);
  }
})();

// 워크플로우 목록 조회
router.get('/', async (req, res) => {
  try {
    const files = await fs.readdir(WORKFLOWS_DIR);
    const workflows = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(WORKFLOWS_DIR, file), 'utf-8');
          const workflow = JSON.parse(content);
          workflows.push({
            id: file.replace('.json', ''),
            name: workflow.name || 'Unnamed',
            created: workflow.created,
            modified: workflow.modified,
            nodeCount: workflow.nodes?.length || 0
          });
        } catch (error) {
          console.error(`Error reading workflow ${file}:`, error);
        }
      }
    }
    
    res.json({ success: true, workflows });
  } catch (error) {
    console.error('Error listing workflows:', error);
    res.status(500).json({ error: '워크플로우 목록을 불러올 수 없습니다.' });
  }
});

// 워크플로우 조회
router.get('/:id', async (req, res) => {
  try {
    const filePath = path.join(WORKFLOWS_DIR, `${req.params.id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const workflow = JSON.parse(content);
    
    res.json({ success: true, workflow });
  } catch (error) {
    console.error('Error loading workflow:', error);
    res.status(404).json({ error: '워크플로우를 찾을 수 없습니다.' });
  }
});

// 워크플로우 저장
router.post('/', async (req, res) => {
  try {
    const { name, nodes, edges, metadata } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '워크플로우 이름이 필요합니다.' });
    }
    
    const id = `workflow-${Date.now()}`;
    const workflow = {
      id,
      name,
      nodes: nodes || [],
      edges: edges || [],
      metadata: metadata || {},
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
    
    const filePath = path.join(WORKFLOWS_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
    
    res.json({ success: true, id, workflow });
  } catch (error) {
    console.error('Error saving workflow:', error);
    res.status(500).json({ error: '워크플로우 저장에 실패했습니다.' });
  }
});

// 워크플로우 업데이트
router.put('/:id', async (req, res) => {
  try {
    const filePath = path.join(WORKFLOWS_DIR, `${req.params.id}.json`);
    
    // 기존 워크플로우 읽기
    const existing = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    // 업데이트
    const updated = {
      ...existing,
      ...req.body,
      id: req.params.id,
      modified: new Date().toISOString()
    };
    
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
    
    res.json({ success: true, workflow: updated });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(404).json({ error: '워크플로우를 찾을 수 없습니다.' });
  }
});

// 워크플로우 삭제
router.delete('/:id', async (req, res) => {
  try {
    const filePath = path.join(WORKFLOWS_DIR, `${req.params.id}.json`);
    await fs.unlink(filePath);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(404).json({ error: '워크플로우를 찾을 수 없습니다.' });
  }
});

module.exports = router;