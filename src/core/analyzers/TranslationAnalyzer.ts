import { BaseAnalyzer, AnalysisResult } from './BaseAnalyzer';
import { TranslationKey } from '../../types/workflow.types';

export interface TranslationAnalysis extends AnalysisResult {
  keys: TranslationKey[];
  languages: string[];
  coverage: Record<string, number>; // 언어별 커버리지
  missingKeys: Array<{
    key: string;
    missingLanguages: string[];
    foundIn: string[];
  }>;
  unusedKeys: TranslationKey[];
  duplicateKeys: Array<{
    key: string;
    locations: Array<{ file: string; line: number }>;
  }>;
  totalKeys: number;
  translatedKeys: number;
  completionPercentage: number;
}

export class TranslationAnalyzer extends BaseAnalyzer {
  private supportedCodeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.html'];
  private supportedTranslationExtensions = ['.json', '.yaml', '.yml', '.po', '.properties'];

  /**
   * 번역 분석 (public 메서드)
   */
  async analyzeTranslations(projectPath: string): Promise<any> {
    // 간단한 구현
    return {
      translationFiles: [],
      usageFiles: [],
      coverage: {},
      missing: [],
      unused: []
    };
  }

  async analyze(filePaths: string[]): Promise<TranslationAnalysis> {
    const analysis: TranslationAnalysis = {
      keys: [],
      languages: [],
      coverage: {},
      missingKeys: [],
      unusedKeys: [],
      duplicateKeys: [],
      totalKeys: 0,
      translatedKeys: 0,
      completionPercentage: 0,
      errors: [],
      warnings: [],
      metadata: {}
    };

    this.progress(0, 100, '번역 분석 시작...');

    try {
      // 번역 파일과 코드 파일 분리
      const translationFiles = this.filterFiles(filePaths, this.supportedTranslationExtensions);
      const codeFiles = this.filterFiles(filePaths, this.supportedCodeExtensions);

      this.progress(10, 100, '번역 파일 분석 중...');
      
      // 번역 파일에서 키와 언어 추출
      const translationData = await this.extractTranslationsFromFiles(translationFiles);
      analysis.keys = translationData.keys;
      analysis.languages = translationData.languages;

      this.progress(40, 100, '코드에서 번역 키 추출 중...');
      
      // 코드에서 사용되는 번역 키 추출
      const usedKeys = await this.extractTranslationKeysFromCode(codeFiles);

      this.progress(70, 100, '커버리지 계산 중...');
      
      // 분석 수행
      analysis.coverage = this.calculateCoverage(analysis.keys, analysis.languages);
      analysis.missingKeys = this.findMissingKeys(usedKeys, analysis.keys, analysis.languages);
      analysis.unusedKeys = this.findUnusedKeys(analysis.keys, usedKeys);
      analysis.duplicateKeys = this.findDuplicateKeys(analysis.keys);

      // 통계 계산
      analysis.totalKeys = analysis.keys.length;
      analysis.translatedKeys = this.countTranslatedKeys(analysis.keys, analysis.languages);
      analysis.completionPercentage = analysis.totalKeys > 0 
        ? Math.round((analysis.translatedKeys / (analysis.totalKeys * analysis.languages.length)) * 100)
        : 100;

      this.progress(90, 100, '메타데이터 생성 중...');

      // 메타데이터 설정
      analysis.metadata = {
        totalTranslationFiles: translationFiles.length,
        totalCodeFiles: codeFiles.length,
        averageCoverage: this.calculateAverageCoverage(analysis.coverage),
        mostTranslatedLanguage: this.getMostTranslatedLanguage(analysis.coverage),
        leastTranslatedLanguage: this.getLeastTranslatedLanguage(analysis.coverage)
      };

      this.progress(100, 100, '번역 분석 완료');

    } catch (error) {
      analysis.errors.push(`번역 분석 실패: ${error}`);
    }

    return this.validateResult(analysis) as TranslationAnalysis;
  }

  /**
   * 번역 파일에서 키와 언어 추출
   */
  private async extractTranslationsFromFiles(translationFiles: string[]): Promise<{
    keys: TranslationKey[];
    languages: string[];
  }> {
    const keyMap = new Map<string, TranslationKey>();
    const languages = new Set<string>();

    for (const filePath of translationFiles) {
      try {
        const fileContent = await this.readFile(filePath);
        const language = this.extractLanguageFromPath(filePath);
        
        if (language) {
          languages.add(language);
          const translations = await this.parseTranslationFile(fileContent, filePath);
          
          Object.entries(translations).forEach(([key, value]) => {
            if (!keyMap.has(key)) {
              keyMap.set(key, {
                id: `key-${key}`,
                key,
                translations: {},
                filePath,
                line: 1 // TODO: 정확한 라인 번호 계산
              });
            }
            
            const translationKey = keyMap.get(key)!;
            translationKey.translations[language] = value as string;
          });
        }
      } catch (error) {
        console.warn(`번역 파일 파싱 실패: ${filePath}`, error);
      }
    }

    return {
      keys: Array.from(keyMap.values()),
      languages: Array.from(languages)
    };
  }

  /**
   * 번역 파일 파싱
   */
  private async parseTranslationFile(content: string, filePath: string): Promise<Record<string, any>> {
    const extension = this.getFileExtension(filePath);
    
    switch (extension) {
      case '.json':
        return this.parseJSON(content);
      case '.yaml':
      case '.yml':
        return this.parseYAML(content);
      case '.po':
        return this.parsePO(content);
      case '.properties':
        return this.parseProperties(content);
      default:
        throw new Error(`지원하지 않는 번역 파일 형식: ${extension}`);
    }
  }

  /**
   * JSON 파싱
   */
  private parseJSON(content: string): Record<string, any> {
    try {
      const data = JSON.parse(content);
      return this.flattenObject(data);
    } catch (error) {
      throw new Error(`JSON 파싱 오류: ${error}`);
    }
  }

  /**
   * YAML 파싱 (간단한 구현)
   */
  private parseYAML(content: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^:]+):\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * PO 파일 파싱
   */
  private parsePO(content: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = content.split('\n');
    let currentKey = '';
    let currentValue = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('msgid ')) {
        currentKey = line.substring(6).replace(/^"|"$/g, '');
      } else if (line.startsWith('msgstr ')) {
        currentValue = line.substring(7).replace(/^"|"$/g, '');
        if (currentKey && currentValue) {
          result[currentKey] = currentValue;
        }
      }
    }
    
    return result;
  }

  /**
   * Properties 파일 파싱
   */
  private parseProperties(content: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('!')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim();
          const value = trimmed.substring(equalIndex + 1).trim();
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * 중첩 객체를 평면화
   */
  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, this.flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  }

  /**
   * 코드에서 번역 키 추출
   */
  private async extractTranslationKeysFromCode(codeFiles: string[]): Promise<Set<string>> {
    const usedKeys = new Set<string>();
    
    for (const filePath of codeFiles) {
      try {
        const content = await this.readFile(filePath);
        const keys = this.extractKeysFromCode(content);
        keys.forEach(key => usedKeys.add(key));
      } catch (error) {
        console.warn(`코드 분석 실패: ${filePath}`, error);
      }
    }
    
    return usedKeys;
  }

  /**
   * 코드에서 번역 키 패턴 매칭
   */
  private extractKeysFromCode(content: string): string[] {
    const keys: string[] = [];
    
    // 일반적인 i18n 패턴들
    const patterns = [
      // t('key'), $t('key'), i18n.t('key')
      /(?:^|\W)(?:\$?t|i18n\.t)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // translate('key')
      /translate\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // useTranslation().t('key')
      /\.t\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // formatMessage({ id: 'key' })
      /formatMessage\s*\(\s*{\s*id\s*:\s*['"`]([^'"`]+)['"`]/g,
      // intl.formatMessage({ id: 'key' })
      /intl\.formatMessage\s*\(\s*{\s*id\s*:\s*['"`]([^'"`]+)['"`]/g,
      // __('key') (gettext style)
      /__\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];
    
    patterns.forEach(pattern => {
      const matches = this.findMatches(content, pattern);
      matches.forEach(match => {
        if (match[1]) {
          keys.push(match[1]);
        }
      });
    });
    
    return keys;
  }

  /**
   * 파일 경로에서 언어 추출
   */
  private extractLanguageFromPath(filePath: string): string | null {
    // 일반적인 패턴들
    const patterns = [
      /\/locales?\/([a-z]{2}(?:-[A-Z]{2})?)\//,  // /locale/en/, /locales/ko-KR/
      /\/([a-z]{2}(?:-[A-Z]{2})?)\.json$/,       // /en.json, /ko-KR.json
      /\/messages[._]([a-z]{2}(?:-[A-Z]{2})?)\./,// messages_en.json, messages.ko.json
      /\/i18n\/([a-z]{2}(?:-[A-Z]{2})?)\//,      // /i18n/en/
    ];
    
    for (const pattern of patterns) {
      const match = filePath.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * 커버리지 계산
   */
  private calculateCoverage(keys: TranslationKey[], languages: string[]): Record<string, number> {
    const coverage: Record<string, number> = {};
    
    languages.forEach(language => {
      const translatedCount = keys.filter(key => 
        key.translations[language] && key.translations[language].trim() !== ''
      ).length;
      
      coverage[language] = keys.length > 0 ? Math.round((translatedCount / keys.length) * 100) : 100;
    });
    
    return coverage;
  }

  /**
   * 누락된 키 찾기
   */
  private findMissingKeys(
    usedKeys: Set<string>, 
    availableKeys: TranslationKey[], 
    languages: string[]
  ): Array<{ key: string; missingLanguages: string[]; foundIn: string[] }> {
    const missingKeys: Array<{ key: string; missingLanguages: string[]; foundIn: string[] }> = [];
    const keyMap = new Map(availableKeys.map(k => [k.key, k]));
    
    usedKeys.forEach(usedKey => {
      const translationKey = keyMap.get(usedKey);
      
      if (!translationKey) {
        // 키가 아예 없는 경우
        missingKeys.push({
          key: usedKey,
          missingLanguages: languages,
          foundIn: []
        });
      } else {
        // 일부 언어에서 누락된 경우
        const missingLanguages = languages.filter(lang => 
          !translationKey.translations[lang] || translationKey.translations[lang].trim() === ''
        );
        
        if (missingLanguages.length > 0) {
          const foundIn = languages.filter(lang => 
            translationKey.translations[lang] && translationKey.translations[lang].trim() !== ''
          );
          
          missingKeys.push({
            key: usedKey,
            missingLanguages,
            foundIn
          });
        }
      }
    });
    
    return missingKeys;
  }

  /**
   * 사용되지 않는 키 찾기
   */
  private findUnusedKeys(availableKeys: TranslationKey[], usedKeys: Set<string>): TranslationKey[] {
    return availableKeys.filter(key => !usedKeys.has(key.key));
  }

  /**
   * 중복 키 찾기
   */
  private findDuplicateKeys(keys: TranslationKey[]): Array<{
    key: string;
    locations: Array<{ file: string; line: number }>;
  }> {
    const keyCount = new Map<string, Array<{ file: string; line: number }>>();
    
    keys.forEach(key => {
      if (!keyCount.has(key.key)) {
        keyCount.set(key.key, []);
      }
      keyCount.get(key.key)!.push({
        file: key.filePath || 'unknown',
        line: key.line || 0
      });
    });
    
    const duplicates: Array<{
      key: string;
      locations: Array<{ file: string; line: number }>;
    }> = [];
    
    keyCount.forEach((locations, key) => {
      if (locations.length > 1) {
        duplicates.push({ key, locations });
      }
    });
    
    return duplicates;
  }

  /**
   * 번역된 키 개수 계산
   */
  private countTranslatedKeys(keys: TranslationKey[], languages: string[]): number {
    let count = 0;
    
    keys.forEach(key => {
      languages.forEach(language => {
        if (key.translations[language] && key.translations[language].trim() !== '') {
          count++;
        }
      });
    });
    
    return count;
  }

  /**
   * 평균 커버리지 계산
   */
  private calculateAverageCoverage(coverage: Record<string, number>): number {
    const values = Object.values(coverage);
    return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  }

  /**
   * 가장 많이 번역된 언어
   */
  private getMostTranslatedLanguage(coverage: Record<string, number>): string {
    return Object.entries(coverage).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];
  }

  /**
   * 가장 적게 번역된 언어
   */
  private getLeastTranslatedLanguage(coverage: Record<string, number>): string {
    return Object.entries(coverage).reduce((a, b) => a[1] < b[1] ? a : b, ['', 100])[0];
  }

  /**
   * 파일 확장자 추출
   */
  private getFileExtension(filePath: string): string {
    return filePath.substring(filePath.lastIndexOf('.'));
  }

  /**
   * 번역 리포트 생성
   */
  generateTranslationReport(analysis: TranslationAnalysis): string {
    let report = '# 번역 분석 리포트\n\n';
    
    report += `## 📊 전체 현황\n`;
    report += `- 총 번역 키: ${analysis.totalKeys}\n`;
    report += `- 지원 언어: ${analysis.languages.join(', ')}\n`;
    report += `- 전체 완성도: ${analysis.completionPercentage}%\n\n`;
    
    report += `## 🌍 언어별 커버리지\n`;
    Object.entries(analysis.coverage).forEach(([language, coverage]) => {
      report += `- ${language}: ${coverage}%\n`;
    });
    report += '\n';
    
    if (analysis.missingKeys.length > 0) {
      report += `## ❌ 누락된 번역 (${analysis.missingKeys.length}개)\n`;
      analysis.missingKeys.slice(0, 10).forEach(missing => {
        report += `- \`${missing.key}\`: ${missing.missingLanguages.join(', ')} 누락\n`;
      });
      if (analysis.missingKeys.length > 10) {
        report += `... 외 ${analysis.missingKeys.length - 10}개\n`;
      }
      report += '\n';
    }
    
    if (analysis.unusedKeys.length > 0) {
      report += `## 🗑️ 사용되지 않는 키 (${analysis.unusedKeys.length}개)\n`;
      analysis.unusedKeys.slice(0, 10).forEach(unused => {
        report += `- \`${unused.key}\`\n`;
      });
      if (analysis.unusedKeys.length > 10) {
        report += `... 외 ${analysis.unusedKeys.length - 10}개\n`;
      }
      report += '\n';
    }
    
    return report;
  }
}