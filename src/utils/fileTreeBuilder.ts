export interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size: number;
  children?: FileTreeNode[];
}

export function buildFileTree(files: File[]): FileTreeNode {
  const root: FileTreeNode = {
    name: 'root',
    type: 'folder',
    path: '/',
    size: 0,
    children: []
  };

  files.forEach(file => {
    const parts = file.webkitRelativePath ? 
      file.webkitRelativePath.split('/') : 
      file.name.split('/');
    
    let current = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existingChild = current.children?.find(child => child.name === part);
      
      if (existingChild) {
        current = existingChild;
      } else {
        const newNode: FileTreeNode = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: parts.slice(0, i + 1).join('/'),
          size: isFile ? file.size : 0,
          children: isFile ? undefined : []
        };
        
        if (!current.children) {
          current.children = [];
        }
        current.children.push(newNode);
        
        if (!isFile) {
          current = newNode;
        }
      }
      
      // Update size for folders
      if (!isFile) {
        current.size += file.size;
      }
    }
  });

  return root;
}