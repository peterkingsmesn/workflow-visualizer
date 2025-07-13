const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// In-memory session storage (replace with database in production)
const sessions = new Map();
const sessionParticipants = new Map();

// 협업 세션 목록
router.get('/sessions', async (req, res) => {
  try {
    const activeSessions = Array.from(sessions.values()).map(session => ({
      ...session,
      participants: sessionParticipants.get(session.id)?.size || 0,
      activeUsers: sessionParticipants.get(session.id) ? 
        Array.from(sessionParticipants.get(session.id)) : []
    }));
    
    res.json({
      success: true,
      sessions: activeSessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions'
    });
  }
});

// 협업 세션 생성
router.post('/sessions', async (req, res) => {
  try {
    const { name, description, userId, userName } = req.body;
    
    if (!name || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Session name and user ID are required'
      });
    }
    
    const sessionId = uuidv4();
    const newSession = {
      id: sessionId,
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      workflow: null,
      settings: {
        maxParticipants: 10,
        allowGuests: false,
        requireApproval: false
      }
    };
    
    sessions.set(sessionId, newSession);
    
    // Add creator as first participant
    const participants = new Set();
    participants.add({ userId, userName: userName || 'Unknown User', role: 'owner' });
    sessionParticipants.set(sessionId, participants);
    
    res.json({
      success: true,
      session: {
        ...newSession,
        participants: 1,
        activeUsers: Array.from(participants)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

// 협업 세션 참가
router.post('/sessions/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const participants = sessionParticipants.get(id) || new Set();
    
    // Check if user already in session
    const existingUser = Array.from(participants).find(p => p.userId === userId);
    if (existingUser) {
      return res.json({
        success: true,
        message: 'Already in session',
        session: {
          ...session,
          participants: participants.size,
          activeUsers: Array.from(participants)
        }
      });
    }
    
    // Check max participants
    if (participants.size >= session.settings.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Session is full'
      });
    }
    
    participants.add({ userId, userName: userName || 'Unknown User', role: 'participant' });
    sessionParticipants.set(id, participants);
    
    // Update last activity
    session.lastActivity = new Date().toISOString();
    
    res.json({
      success: true,
      message: `Joined session ${session.name}`,
      session: {
        ...session,
        participants: participants.size,
        activeUsers: Array.from(participants)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to join session'
    });
  }
});

// 협업 세션 떠나기
router.post('/sessions/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const participants = sessionParticipants.get(id);
    if (participants) {
      const updatedParticipants = new Set(
        Array.from(participants).filter(p => p.userId !== userId)
      );
      
      if (updatedParticipants.size === 0) {
        // Remove empty session
        sessions.delete(id);
        sessionParticipants.delete(id);
      } else {
        sessionParticipants.set(id, updatedParticipants);
      }
    }
    
    res.json({
      success: true,
      message: 'Left session successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to leave session'
    });
  }
});

// 세션 워크플로우 업데이트
router.put('/sessions/:id/workflow', async (req, res) => {
  try {
    const { id } = req.params;
    const { workflow, userId } = req.body;
    
    const session = sessions.get(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    session.workflow = workflow;
    session.lastActivity = new Date().toISOString();
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow'
    });
  }
});

module.exports = router;