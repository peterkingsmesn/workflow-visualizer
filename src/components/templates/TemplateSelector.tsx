import React, { useState } from 'react';
import { X, FileText, Code, Database, Smartphone, Globe } from 'lucide-react';
import { workflowTemplates, WorkflowTemplate, createEmptyWorkflow } from '../../templates/workflowTemplates';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkflowTemplate | null) => void;
}

const categoryIcons = {
  frontend: <Code className="w-5 h-5" />,
  backend: <Database className="w-5 h-5" />,
  fullstack: <Globe className="w-5 h-5" />,
  mobile: <Smartphone className="w-5 h-5" />,
  api: <FileText className="w-5 h-5" />
};

const categoryNames = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Full Stack',
  mobile: 'Mobile',
  api: 'API'
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<WorkflowTemplate['category'] | 'all'>('all');

  if (!isOpen) return null;

  const filteredTemplates = selectedCategory === 'all' 
    ? workflowTemplates 
    : workflowTemplates.filter(template => template.category === selectedCategory);

  const handleSelectTemplate = (template: WorkflowTemplate | null) => {
    onSelectTemplate(template);
    onClose();
  };

  const categories = Object.keys(categoryNames) as WorkflowTemplate['category'][];

  return (
    <div className="template-selector-overlay">
      <div className="template-selector-modal">
        <div className="template-selector-header">
          <h2>Choose Workflow Template</h2>
          <button 
            onClick={onClose}
            className="close-button"
            aria-label="Close template selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="template-selector-body">
          {/* Category Filter */}
          <div className="category-filter">
            <button
              className={`category-button ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Templates
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {categoryIcons[category]}
                {categoryNames[category]}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="templates-grid">
            {/* Empty Template */}
            <div 
              className="template-card empty-template"
              onClick={() => handleSelectTemplate(null)}
            >
              <div className="template-icon">
                <FileText className="w-8 h-8" />
              </div>
              <h3>Empty Workflow</h3>
              <p>Start with a blank canvas</p>
            </div>

            {/* Template Cards */}
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="template-card"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="template-icon">
                  {categoryIcons[template.category]}
                </div>
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <div className="template-meta">
                  <span className={`category-badge ${template.category}`}>
                    {categoryNames[template.category]}
                  </span>
                  <span className="node-count">
                    {template.nodes.length} nodes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .template-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .template-selector-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .template-selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .template-selector-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .close-button {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background-color: #f3f4f6;
        }

        .template-selector-body {
          padding: 20px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .category-filter {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .category-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .category-button:hover {
          background-color: #f3f4f6;
        }

        .category-button.active {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        .template-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .template-card.empty-template {
          border: 2px dashed #d1d5db;
          text-align: center;
        }

        .template-card.empty-template:hover {
          border-color: #6b7280;
          background-color: #f9fafb;
        }

        .template-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background-color: #f3f4f6;
          margin-bottom: 12px;
          color: #6b7280;
        }

        .template-card h3 {
          margin: 0 0 8px 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .template-card p {
          margin: 0 0 16px 0;
          color: #6b7280;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .template-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
        }

        .category-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .category-badge.frontend {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .category-badge.backend {
          background-color: #dcfce7;
          color: #166534;
        }

        .category-badge.fullstack {
          background-color: #fef3c7;
          color: #92400e;
        }

        .category-badge.mobile {
          background-color: #ede9fe;
          color: #6b21a8;
        }

        .category-badge.api {
          background-color: #fce7f3;
          color: #be185d;
        }

        .node-count {
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};