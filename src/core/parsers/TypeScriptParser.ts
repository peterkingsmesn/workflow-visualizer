import { JavaScriptParser, ParseResult } from './JavaScriptParser';

export interface TypeScriptParseResult extends ParseResult {
  interfaces: InterfaceInfo[];
  types: TypeInfo[];
  enums: EnumInfo[];
}

interface InterfaceInfo {
  name: string;
  properties: PropertyInfo[];
  line: number;
}

interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
}

interface TypeInfo {
  name: string;
  definition: string;
  line: number;
}

interface EnumInfo {
  name: string;
  values: string[];
  line: number;
}

export class TypeScriptParser extends JavaScriptParser {
  async parse(filePath: string): Promise<TypeScriptParseResult> {
    const baseResult = await super.parse(filePath);
    const content = await this.readFile(filePath);
    
    const result: TypeScriptParseResult = {
      ...baseResult,
      interfaces: this.parseInterfaces(content),
      types: this.parseTypes(content),
      enums: this.parseEnums(content)
    };
    
    return result;
  }

  private async readFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    return fs.readFile(filePath, 'utf-8');
  }

  private parseInterfaces(content: string): InterfaceInfo[] {
    const interfaces: InterfaceInfo[] = [];
    
    const interfaceRegex = /interface\s+(\w+)(?:<[^>]+>)?\s*(?:extends\s+[^{]+)?\s*\{/g;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const interfaceName = match[1];
      const interfaceStart = match.index + match[0].length;
      const interfaceBody = this.extractBlock(content, interfaceStart);
      const properties = this.parseInterfaceProperties(interfaceBody);
      
      interfaces.push({
        name: interfaceName,
        properties,
        line: lineNumber
      });
    }
    
    return interfaces;
  }

  private parseInterfaceProperties(body: string): PropertyInfo[] {
    const properties: PropertyInfo[] = [];
    const propRegex = /(\w+)(\?)?:\s*([^;]+);/g;
    let match;
    
    while ((match = propRegex.exec(body)) !== null) {
      properties.push({
        name: match[1],
        type: match[3].trim(),
        optional: !!match[2]
      });
    }
    
    return properties;
  }

  private parseTypes(content: string): TypeInfo[] {
    const types: TypeInfo[] = [];
    
    const typeRegex = /type\s+(\w+)(?:<[^>]+>)?\s*=\s*([^;]+);/g;
    let match;
    
    while ((match = typeRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      types.push({
        name: match[1],
        definition: match[2].trim(),
        line: lineNumber
      });
    }
    
    return types;
  }

  private parseEnums(content: string): EnumInfo[] {
    const enums: EnumInfo[] = [];
    
    const enumRegex = /enum\s+(\w+)\s*\{/g;
    let match;
    
    while ((match = enumRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const enumName = match[1];
      const enumStart = match.index + match[0].length;
      const enumBody = this.extractBlock(content, enumStart);
      const values = this.parseEnumValues(enumBody);
      
      enums.push({
        name: enumName,
        values,
        line: lineNumber
      });
    }
    
    return enums;
  }

  private parseEnumValues(body: string): string[] {
    const values: string[] = [];
    const valueRegex = /(\w+)(?:\s*=\s*[^,]+)?/g;
    let match;
    
    while ((match = valueRegex.exec(body)) !== null) {
      values.push(match[1]);
    }
    
    return values;
  }

  private extractBlock(content: string, startIndex: number): string {
    let braceCount = 1;
    let i = startIndex;
    
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    return content.substring(startIndex, i - 1);
  }

  protected parseImports(content: string): string[] {
    const imports = super.parseImports(content);
    
    // Add TypeScript-specific imports (type imports)
    const typeImportRegex = /import\s+type\s*\{[^}]*\}\s*from\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = typeImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return [...new Set(imports)];
  }

  protected parseExports(content: string): string[] {
    const exports = super.parseExports(content);
    
    // Add TypeScript-specific exports
    const typeExportRegex = /export\s+(?:type|interface|enum)\s+(\w+)/g;
    let match;
    while ((match = typeExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return [...new Set(exports)];
  }
}