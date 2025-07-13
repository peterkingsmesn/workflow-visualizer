const fs = require('fs').promises;
const path = require('path');

class TranslationAnalysisService {
  /**
   * 코드에서 번역 키 추출
   */
  extractTranslationKeysFromCode(code, filePath) {
    const keys = [];
    
    // 일반적인 i18n 패턴들
    const patterns = [
      // t('key'), i18n.t('key')
      /(?:^|\W)(?:t|i18n\.t)\s*\(\s*['""`]([^'""`]+)['""`]/g,
      // $t('key') - Vue.js
      /\$t\s*\(\s*['""`]([^'""`]+)['""`]/g,
      // useTranslation().t('key') - React
      /useTranslation\(\)\.t\s*\(\s*['""`]([^'""`]+)['""`]/g,
      // translate('key')
      /translate\s*\(\s*['""`]([^'""`]+)['""`]/g,
      // FormattedMessage id="key" - React Intl
      /FormattedMessage\s+[^>]*id\s*=\s*['""`]([^'""`]+)['""`]/g,
      // trans key="key" - Angular
      /trans\s+key\s*=\s*['""`]([^'""`]+)['""`]/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const key = match[1];
        const line = code.substring(0, match.index).split('\n').length;
        const lineStart = code.lastIndexOf('\n', match.index) + 1;
        const lineEnd = code.indexOf('\n', match.index);
        const context = code.substring(lineStart, lineEnd === -1 ? match.index + 50 : lineEnd);
        
        keys.push({
          key,
          line,
          context: context.trim()
        });
      }
    });
    
    return keys;
  }

  /**
   * 번역 파일에서 키 추출
   */
  extractTranslationKeysFromFile(content, filePath) {
    const keys = [];
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      if (ext === '.json') {
        // JSON 형태의 번역 파일
        const data = JSON.parse(content);
        this.extractKeysFromObject(data, '', keys, content);
      } else if (ext === '.js' || ext === '.ts') {
        // JavaScript/TypeScript 형태의 번역 파일
        const exportMatch = content.match(/export\s+default\s+({[\s\S]*})/);
        if (exportMatch) {
          try {
            const objStr = exportMatch[1];
            const data = this.parseObjectString(objStr);
            this.extractKeysFromObject(data, '', keys, content);
          } catch (e) {
            console.warn('Failed to parse JS/TS translation file:', filePath);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing translation file:', error);
    }
    
    return keys;
  }

  /**
   * 중첩된 객체에서 키 추출 (dot notation)
   */
  extractKeysFromObject(obj, prefix, keys, originalContent) {
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.extractKeysFromObject(value, fullKey, keys, originalContent);
      } else {
        // 키의 위치 찾기 (근사치)
        const keyPattern = new RegExp(`["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']\\s*:`);
        const match = originalContent.match(keyPattern);
        const line = match ? originalContent.substring(0, match.index).split('\n').length : 1;
        
        keys.push({
          key: fullKey,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          line
        });
      }
    });
  }

  /**
   * 간단한 객체 문자열 파싱 (보안상 eval 사용 안함)
   */
  parseObjectString(objStr) {
    try {
      // 기본적인 객체 구조만 파싱 (완벽하지 않지만 대부분의 경우에 작동)
      return JSON.parse(objStr.replace(/'/g, '"').replace(/(\w+):/g, '"$1":'));
    } catch (e) {
      return {};
    }
  }

  /**
   * 파일 경로에서 언어 추출
   */
  extractLanguageFromPath(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // 일반적인 패턴들
    // en.json, ko.json
    if (/^[a-z]{2}$/.test(fileName)) {
      return fileName;
    }
    
    // messages.en.json, locales.ko.json
    const langMatch = fileName.match(/\.([a-z]{2})$/);
    if (langMatch) {
      return langMatch[1];
    }
    
    // en-US.json, ko-KR.json
    const localeLangMatch = fileName.match(/^([a-z]{2})-[A-Z]{2}$/);
    if (localeLangMatch) {
      return localeLangMatch[1];
    }
    
    // 경로에서 언어 추출 시도
    // /locales/en/, /i18n/ko/
    const pathLangMatch = filePath.match(/[\/\\](en|ko|ja|zh|fr|de|es|it|pt|ru)[\/\\]/);
    if (pathLangMatch) {
      return pathLangMatch[1];
    }
    
    return fileName; // 기본값으로 파일명 사용
  }

  /**
   * 번역 키 커버리지 분석
   */
  async analyzeTranslationCoverage(filePaths, translationFiles) {
    const translationKeys = {
      used: new Map(), // 코드에서 사용된 키들
      defined: new Map(), // 번역 파일에 정의된 키들
      coverage: {},
      missing: [],
      unused: []
    };
    
    // 1. 코드 파일에서 번역 키 추출
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const keys = this.extractTranslationKeysFromCode(content, filePath);
        
        keys.forEach(key => {
          if (!translationKeys.used.has(key.key)) {
            translationKeys.used.set(key.key, []);
          }
          translationKeys.used.get(key.key).push({
            file: filePath,
            line: key.line,
            context: key.context
          });
        });
        
      } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error);
      }
    }
    
    // 2. 번역 파일에서 정의된 키 추출
    if (translationFiles && Array.isArray(translationFiles)) {
      for (const translationFile of translationFiles) {
        try {
          const content = await fs.readFile(translationFile, 'utf-8');
          const keys = this.extractTranslationKeysFromFile(content, translationFile);
          
          const language = this.extractLanguageFromPath(translationFile);
          if (!translationKeys.defined.has(language)) {
            translationKeys.defined.set(language, new Map());
          }
          
          keys.forEach(key => {
            translationKeys.defined.get(language).set(key.key, {
              value: key.value,
              file: translationFile,
              line: key.line
            });
          });
          
        } catch (error) {
          console.error(`Error analyzing translation file ${translationFile}:`, error);
        }
      }
    }
    
    // 3. 커버리지 분석
    const usedKeys = Array.from(translationKeys.used.keys());
    const languages = Array.from(translationKeys.defined.keys());
    
    languages.forEach(lang => {
      const definedKeys = Array.from(translationKeys.defined.get(lang).keys());
      
      translationKeys.coverage[lang] = {
        total: usedKeys.length,
        covered: usedKeys.filter(key => definedKeys.includes(key)).length,
        percentage: usedKeys.length > 0 ? 
          Math.round((usedKeys.filter(key => definedKeys.includes(key)).length / usedKeys.length) * 100) : 100
      };
    });
    
    // 4. 누락된 키 찾기
    usedKeys.forEach(key => {
      const missingInLanguages = languages.filter(lang => 
        !translationKeys.defined.get(lang).has(key)
      );
      
      if (missingInLanguages.length > 0) {
        translationKeys.missing.push({
          key,
          missingIn: missingInLanguages,
          usedIn: translationKeys.used.get(key)
        });
      }
    });
    
    // 5. 사용되지 않는 키 찾기
    languages.forEach(lang => {
      const definedKeys = Array.from(translationKeys.defined.get(lang).keys());
      const unusedInLang = definedKeys.filter(key => !usedKeys.includes(key));
      
      unusedInLang.forEach(key => {
        translationKeys.unused.push({
          key,
          language: lang,
          definedIn: translationKeys.defined.get(lang).get(key)
        });
      });
    });
    
    return {
      used: Object.fromEntries(translationKeys.used),
      defined: Object.fromEntries(
        Array.from(translationKeys.defined.entries()).map(([lang, keys]) => [
          lang, Object.fromEntries(keys)
        ])
      ),
      coverage: translationKeys.coverage,
      missing: translationKeys.missing,
      unused: translationKeys.unused
    };
  }
}

module.exports = TranslationAnalysisService;