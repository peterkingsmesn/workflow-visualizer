export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modified?: Date;
  extension?: string;
}

export interface ScanOptions {
  maxDepth?: number;
  excludePatterns?: string[];
  includeHidden?: boolean;
  fileExtensions?: string[] | null;
}

export class FileSystemService {
  private apiBase = 'http://localhost:3001/api/files';

  async scanDirectory(
    dirPath: string, 
    options: ScanOptions = {}
  ): Promise<FileNode> {
    try {
      const response = await fetch(`${this.apiBase}/tree`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rootPath: dirPath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to scan directory');
      }

      const data = await response.json();
      return data.tree;
    } catch (error) {
      console.error('Failed to scan directory:', error);
      throw error;
    }
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiBase}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to read file');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
      throw error;
    }
  }

  async searchFiles(rootPath: string, pattern: string, searchContent?: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBase}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rootPath, pattern, searchContent }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search files');
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Failed to search files:', error);
      throw error;
    }
  }

  async analyzeProject(rootPath: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiBase}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rootPath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze project');
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Failed to analyze project:', error);
      throw error;
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/exists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error(`Failed to check if file exists ${filePath}:`, error);
      return false;
    }
  }
}