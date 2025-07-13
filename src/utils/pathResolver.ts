import * as path from 'path';

class PathResolver {
  /**
   * Resolve an import path relative to a source file
   */
  resolve(importPath: string, sourceFile: string): string | null {
    // Handle node_modules imports
    if (!this.isRelativePath(importPath)) {
      return this.resolveNodeModule(importPath);
    }

    // Handle relative imports
    const sourceDir = path.dirname(sourceFile);
    const resolvedPath = path.resolve(sourceDir, importPath);

    // Try different extensions if no extension provided
    if (!path.extname(resolvedPath)) {
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
      
      for (const ext of extensions) {
        const pathWithExt = resolvedPath + ext;
        if (this.fileExists(pathWithExt)) {
          return pathWithExt;
        }
      }

      // Try index file
      for (const ext of extensions) {
        const indexPath = path.join(resolvedPath, `index${ext}`);
        if (this.fileExists(indexPath)) {
          return indexPath;
        }
      }
    }

    return this.fileExists(resolvedPath) ? resolvedPath : null;
  }

  /**
   * Check if a path is relative (starts with ./ or ../)
   */
  isRelativePath(importPath: string): boolean {
    return importPath.startsWith('./') || importPath.startsWith('../');
  }

  /**
   * Resolve a node_modules import
   */
  resolveNodeModule(moduleName: string): string | null {
    // This is a simplified version. In a real implementation,
    // you would need to traverse up the directory tree looking for node_modules
    // and respect the package.json main field
    return `node_modules/${moduleName}`;
  }

  /**
   * Check if a file exists (mock implementation for browser environment)
   */
  private fileExists(filePath: string): boolean {
    // In a real implementation, this would check the file system
    // For now, we'll return true for demonstration
    return true;
  }

  /**
   * Convert a file path to a URL-safe format
   */
  toUrlPath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Get the relative path between two absolute paths
   */
  relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Normalize a path (remove redundant . and .. segments)
   */
  normalize(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Join path segments
   */
  join(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Get the directory name of a path
   */
  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Get the base name of a path
   */
  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  /**
   * Get the extension of a path
   */
  extname(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Check if a path is absolute
   */
  isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  /**
   * Parse a path into its components
   */
  parse(filePath: string): path.ParsedPath {
    return path.parse(filePath);
  }

  /**
   * Format a parsed path object into a path string
   */
  format(pathObject: path.ParsedPath): string {
    return path.format(pathObject);
  }
}

export const pathResolver = new PathResolver();