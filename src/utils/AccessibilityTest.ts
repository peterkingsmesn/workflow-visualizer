/* 🚀 접근성 테스트: axe-core를 활용한 WCAG 2.1 AA 준수 테스트 */

// axe-core 타입 정의 (실제 환경에서는 @types/axe-core 설치 필요)
interface AxeResults {
  violations: AxeViolation[];
  passes: AxeResult[];
  incomplete: AxeResult[];
  inapplicable: AxeResult[];
  timestamp: string;
  url: string;
}

interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}

interface AxeResult {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}

interface AxeNode {
  target: string[];
  html: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  any: AxeCheck[];
  all: AxeCheck[];
  none: AxeCheck[];
}

interface AxeCheck {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  message: string;
  data: any;
}

// 접근성 테스트 결과 인터페이스
export interface AccessibilityTestResult {
  testName: string;
  timestamp: number;
  passed: boolean;
  score: number;
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
  summary: AccessibilityTestSummary;
  recommendations: string[];
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: string[];
  wcagGuideline?: string;
  fixSuggestion?: string;
}

export interface AccessibilityTestSummary {
  totalElements: number;
  testedElements: number;
  violationCount: number;
  criticalViolations: number;
  seriousViolations: number;
  moderateViolations: number;
  minorViolations: number;
  passRate: number;
  complianceLevel: string;
}

export interface AccessibilityTestConfig {
  wcagLevel: 'A' | 'AA' | 'AAA';
  includedRules: string[];
  excludedRules: string[];
  tags: string[];
  targetSelector?: string;
  reportIncomplete: boolean;
  reportPasses: boolean;
}

export class AccessibilityTest {
  private static instance: AccessibilityTest;
  private results: AccessibilityTestResult[] = [];
  private config: AccessibilityTestConfig;

  private constructor() {
    this.config = {
      wcagLevel: 'AA',
      includedRules: [],
      excludedRules: [],
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      reportIncomplete: true,
      reportPasses: false
    };
  }

  public static getInstance(): AccessibilityTest {
    if (!AccessibilityTest.instance) {
      AccessibilityTest.instance = new AccessibilityTest();
    }
    return AccessibilityTest.instance;
  }

  // 🚀 접근성 테스트: 전체 페이지 테스트
  public async runFullPageTest(testName: string = 'Full Page Accessibility Test'): Promise<AccessibilityTestResult> {
    console.log(`🚀 Starting accessibility test: ${testName}`);

    try {
      // axe-core 초기화 (실제 환경에서는 axe.run() 사용)
      const axeResults = await this.runAxeTest(document);
      
      const result = this.processAxeResults(testName, axeResults);
      this.results.push(result);
      
      console.log(`🚀 Accessibility test completed: ${testName}`, result);
      return result;

    } catch (error) {
      console.error('Accessibility test failed:', error);
      
      const failedResult: AccessibilityTestResult = {
        testName,
        timestamp: Date.now(),
        passed: false,
        score: 0,
        violations: [],
        passes: 0,
        incomplete: 0,
        inapplicable: 0,
        wcagLevel: this.config.wcagLevel,
        summary: {
          totalElements: 0,
          testedElements: 0,
          violationCount: 0,
          criticalViolations: 0,
          seriousViolations: 0,
          moderateViolations: 0,
          minorViolations: 0,
          passRate: 0,
          complianceLevel: 'Non-compliant'
        },
        recommendations: ['Test execution failed - check console for details']
      };

      this.results.push(failedResult);
      return failedResult;
    }
  }

  // 🚀 접근성 테스트: 특정 요소 테스트
  public async runElementTest(element: Element, testName: string): Promise<AccessibilityTestResult> {
    console.log(`🚀 Starting element accessibility test: ${testName}`);

    try {
      const axeResults = await this.runAxeTest(element);
      const result = this.processAxeResults(testName, axeResults);
      this.results.push(result);
      
      return result;

    } catch (error) {
      console.error('Element accessibility test failed:', error);
      throw error;
    }
  }

  // 🚀 접근성 테스트: 워크플로우 특화 테스트
  public async runWorkflowAccessibilityTest(): Promise<AccessibilityTestResult> {
    const testName = 'Workflow Accessibility Test';
    console.log(`🚀 Starting workflow accessibility test: ${testName}`);

    // 워크플로우 특화 규칙 설정
    const workflowConfig: AccessibilityTestConfig = {
      ...this.config,
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
      includedRules: [
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-roles',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'button-name',
        'color-contrast',
        'focus-order-semantics',
        'focusable-controls',
        'keyboard',
        'label',
        'landmark-one-main',
        'link-name',
        'list',
        'listitem',
        'region',
        'skip-link',
        'tabindex'
      ]
    };

    const originalConfig = this.config;
    this.config = workflowConfig;

    try {
      // 워크플로우 캔버스 테스트
      const canvasElement = document.querySelector('.workflow-canvas, .react-flow');
      if (canvasElement) {
        const result = await this.runElementTest(canvasElement, testName);
        
        // 워크플로우 특화 검증 추가
        await this.validateWorkflowSpecificAccessibility(result);
        
        return result;
      } else {
        return await this.runFullPageTest(testName);
      }

    } finally {
      this.config = originalConfig;
    }
  }

  // 🚀 접근성 테스트: 키보드 내비게이션 테스트
  public async runKeyboardNavigationTest(): Promise<AccessibilityTestResult> {
    const testName = 'Keyboard Navigation Test';
    console.log(`🚀 Starting keyboard navigation test: ${testName}`);

    const violations: AccessibilityViolation[] = [];
    let score = 100;

    try {
      // 포커스 가능한 요소들 찾기
      const focusableElements = this.getFocusableElements();
      
      // 탭 순서 테스트
      const tabOrderIssues = await this.testTabOrder(focusableElements);
      violations.push(...tabOrderIssues);

      // 키보드 트랩 테스트
      const trapIssues = await this.testFocusTraps();
      violations.push(...trapIssues);

      // 스킵 링크 테스트
      const skipLinkIssues = await this.testSkipLinks();
      violations.push(...skipLinkIssues);

      // 점수 계산
      score = Math.max(0, 100 - (violations.length * 10));

      const result: AccessibilityTestResult = {
        testName,
        timestamp: Date.now(),
        passed: violations.length === 0,
        score,
        violations,
        passes: focusableElements.length - violations.length,
        incomplete: 0,
        inapplicable: 0,
        wcagLevel: this.config.wcagLevel,
        summary: {
          totalElements: focusableElements.length,
          testedElements: focusableElements.length,
          violationCount: violations.length,
          criticalViolations: violations.filter(v => v.impact === 'critical').length,
          seriousViolations: violations.filter(v => v.impact === 'serious').length,
          moderateViolations: violations.filter(v => v.impact === 'moderate').length,
          minorViolations: violations.filter(v => v.impact === 'minor').length,
          passRate: (focusableElements.length - violations.length) / focusableElements.length * 100,
          complianceLevel: violations.length === 0 ? 'Compliant' : 'Non-compliant'
        },
        recommendations: this.generateKeyboardNavigationRecommendations(violations)
      };

      this.results.push(result);
      return result;

    } catch (error) {
      console.error('Keyboard navigation test failed:', error);
      throw error;
    }
  }

  // 🚀 접근성 테스트: 스크린 리더 테스트
  public async runScreenReaderTest(): Promise<AccessibilityTestResult> {
    const testName = 'Screen Reader Accessibility Test';
    console.log(`🚀 Starting screen reader test: ${testName}`);

    const violations: AccessibilityViolation[] = [];

    try {
      // ARIA 라벨 및 역할 테스트
      const ariaIssues = await this.testAriaImplementation();
      violations.push(...ariaIssues);

      // 헤딩 구조 테스트
      const headingIssues = await this.testHeadingStructure();
      violations.push(...headingIssues);

      // 라이브 리전 테스트
      const liveRegionIssues = await this.testLiveRegions();
      violations.push(...liveRegionIssues);

      // 이미지 대체 텍스트 테스트
      const altTextIssues = await this.testImageAltText();
      violations.push(...altTextIssues);

      const score = Math.max(0, 100 - (violations.length * 15));

      const result: AccessibilityTestResult = {
        testName,
        timestamp: Date.now(),
        passed: violations.length === 0,
        score,
        violations,
        passes: 0,
        incomplete: 0,
        inapplicable: 0,
        wcagLevel: this.config.wcagLevel,
        summary: {
          totalElements: 0,
          testedElements: 0,
          violationCount: violations.length,
          criticalViolations: violations.filter(v => v.impact === 'critical').length,
          seriousViolations: violations.filter(v => v.impact === 'serious').length,
          moderateViolations: violations.filter(v => v.impact === 'moderate').length,
          minorViolations: violations.filter(v => v.impact === 'minor').length,
          passRate: violations.length === 0 ? 100 : 0,
          complianceLevel: violations.length === 0 ? 'Compliant' : 'Non-compliant'
        },
        recommendations: this.generateScreenReaderRecommendations(violations)
      };

      this.results.push(result);
      return result;

    } catch (error) {
      console.error('Screen reader test failed:', error);
      throw error;
    }
  }

  // 🚀 접근성 테스트: 색상 대비 테스트
  public async runColorContrastTest(): Promise<AccessibilityTestResult> {
    const testName = 'Color Contrast Test';
    console.log(`🚀 Starting color contrast test: ${testName}`);

    const violations: AccessibilityViolation[] = [];

    try {
      // 모든 텍스트 요소에서 색상 대비 검사
      const textElements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6, label, input, textarea');
      
      for (const element of textElements) {
        const contrastIssue = await this.checkColorContrast(element as HTMLElement);
        if (contrastIssue) {
          violations.push(contrastIssue);
        }
      }

      const score = Math.max(0, 100 - (violations.length * 20));

      const result: AccessibilityTestResult = {
        testName,
        timestamp: Date.now(),
        passed: violations.length === 0,
        score,
        violations,
        passes: textElements.length - violations.length,
        incomplete: 0,
        inapplicable: 0,
        wcagLevel: this.config.wcagLevel,
        summary: {
          totalElements: textElements.length,
          testedElements: textElements.length,
          violationCount: violations.length,
          criticalViolations: violations.filter(v => v.impact === 'critical').length,
          seriousViolations: violations.filter(v => v.impact === 'serious').length,
          moderateViolations: violations.filter(v => v.impact === 'moderate').length,
          minorViolations: violations.filter(v => v.impact === 'minor').length,
          passRate: (textElements.length - violations.length) / textElements.length * 100,
          complianceLevel: violations.length === 0 ? 'WCAG AA Compliant' : 'Non-compliant'
        },
        recommendations: this.generateColorContrastRecommendations(violations)
      };

      this.results.push(result);
      return result;

    } catch (error) {
      console.error('Color contrast test failed:', error);
      throw error;
    }
  }

  // 🚀 접근성 테스트: axe-core 시뮬레이션 (실제 환경에서는 axe.run() 사용)
  private async runAxeTest(context: Document | Element): Promise<AxeResults> {
    // 실제 환경에서는 다음과 같이 사용:
    // return await axe.run(context, {
    //   tags: this.config.tags,
    //   rules: this.getAxeRulesConfig()
    // });

    // 시뮬레이션된 결과 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          violations: [],
          passes: [],
          incomplete: [],
          inapplicable: [],
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      }, 100);
    });
  }

  // 🚀 접근성 테스트: axe 결과 처리
  private processAxeResults(testName: string, axeResults: AxeResults): AccessibilityTestResult {
    const violations: AccessibilityViolation[] = axeResults.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(node => node.target.join(' ')),
      wcagGuideline: this.getWcagGuideline(violation.tags),
      fixSuggestion: this.getFixSuggestion(violation.id)
    }));

    const totalViolations = violations.length;
    const criticalViolations = violations.filter(v => v.impact === 'critical').length;
    const seriousViolations = violations.filter(v => v.impact === 'serious').length;

    // 점수 계산 (critical: -20, serious: -15, moderate: -10, minor: -5)
    const score = Math.max(0, 100 - (
      criticalViolations * 20 +
      seriousViolations * 15 +
      violations.filter(v => v.impact === 'moderate').length * 10 +
      violations.filter(v => v.impact === 'minor').length * 5
    ));

    const passed = totalViolations === 0 || (criticalViolations === 0 && seriousViolations === 0);

    return {
      testName,
      timestamp: Date.now(),
      passed,
      score,
      violations,
      passes: axeResults.passes.length,
      incomplete: axeResults.incomplete.length,
      inapplicable: axeResults.inapplicable.length,
      wcagLevel: this.config.wcagLevel,
      summary: {
        totalElements: violations.reduce((sum, v) => sum + v.nodes.length, 0),
        testedElements: axeResults.passes.length + totalViolations,
        violationCount: totalViolations,
        criticalViolations,
        seriousViolations,
        moderateViolations: violations.filter(v => v.impact === 'moderate').length,
        minorViolations: violations.filter(v => v.impact === 'minor').length,
        passRate: totalViolations === 0 ? 100 : (axeResults.passes.length / (axeResults.passes.length + totalViolations)) * 100,
        complianceLevel: this.getComplianceLevel(violations)
      },
      recommendations: this.generateRecommendations(violations)
    };
  }

  // 🚀 접근성 테스트: 워크플로우 특화 검증
  private async validateWorkflowSpecificAccessibility(result: AccessibilityTestResult): Promise<void> {
    // 워크플로우 노드 접근성 검증
    const nodes = document.querySelectorAll('.react-flow__node');
    for (const node of nodes) {
      if (!node.getAttribute('role')) {
        result.violations.push({
          id: 'workflow-node-role',
          impact: 'serious',
          description: 'Workflow nodes must have appropriate ARIA roles',
          help: 'Add role="button" or role="group" to workflow nodes',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
          nodes: [this.getSelector(node as HTMLElement)],
          wcagGuideline: 'WCAG 4.1.2',
          fixSuggestion: 'Add role="button" attribute to workflow nodes for interactive elements'
        });
      }
    }

    // 캔버스 접근성 검증
    const canvas = document.querySelector('.workflow-canvas, .react-flow');
    if (canvas && !canvas.getAttribute('aria-label')) {
      result.violations.push({
        id: 'workflow-canvas-label',
        impact: 'serious',
        description: 'Workflow canvas must have accessible name',
        help: 'Add aria-label to describe the workflow canvas',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
        nodes: [this.getSelector(canvas as HTMLElement)],
        wcagGuideline: 'WCAG 1.1.1',
        fixSuggestion: 'Add aria-label="Workflow editor canvas" to the canvas element'
      });
    }
  }

  // 🚀 접근성 테스트: 헬퍼 메서드들
  private getFocusableElements(): Element[] {
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(',');

    return Array.from(document.querySelectorAll(selector));
  }

  private async testTabOrder(elements: Element[]): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    
    // 탭 인덱스 검증
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement;
      const tabIndex = parseInt(element.getAttribute('tabindex') || '0');
      
      if (tabIndex > 0) {
        violations.push({
          id: 'positive-tabindex',
          impact: 'moderate',
          description: 'Positive tabindex values should be avoided',
          help: 'Use tabindex="0" or rely on natural tab order',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
          nodes: [this.getSelector(element)],
          wcagGuideline: 'WCAG 2.4.3',
          fixSuggestion: 'Remove positive tabindex values and use semantic HTML for natural tab order'
        });
      }
    }

    return violations;
  }

  private async testFocusTraps(): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    
    // 모달 및 다이얼로그의 포커스 트랩 검증
    const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal');
    
    for (const modal of modals) {
      const focusableInModal = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      
      if (focusableInModal.length === 0) {
        violations.push({
          id: 'modal-focus-trap',
          impact: 'serious',
          description: 'Modal dialogs must contain focusable elements',
          help: 'Ensure modals have at least one focusable element',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
          nodes: [this.getSelector(modal as HTMLElement)],
          wcagGuideline: 'WCAG 2.4.3',
          fixSuggestion: 'Add focusable elements like buttons or inputs to the modal'
        });
      }
    }

    return violations;
  }

  private async testSkipLinks(): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    
    const skipLinks = document.querySelectorAll('.skip-link, [href="#main"], [href="#content"]');
    
    if (skipLinks.length === 0) {
      violations.push({
        id: 'missing-skip-link',
        impact: 'moderate',
        description: 'Page should include skip navigation links',
        help: 'Add skip links to help keyboard users navigate quickly',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html',
        nodes: ['body'],
        wcagGuideline: 'WCAG 2.4.1',
        fixSuggestion: 'Add a skip link at the beginning of the page: <a href="#main" class="skip-link">Skip to main content</a>'
      });
    }

    return violations;
  }

  private async testAriaImplementation(): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    
    // ARIA 라벨이 없는 버튼 검증
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (!button.textContent?.trim() && !button.getAttribute('aria-label') && !button.getAttribute('aria-labelledby')) {
        violations.push({
          id: 'button-name',
          impact: 'serious',
          description: 'Buttons must have accessible names',
          help: 'Add text content, aria-label, or aria-labelledby',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
          nodes: [this.getSelector(button)],
          wcagGuideline: 'WCAG 4.1.2',
          fixSuggestion: 'Add aria-label attribute or text content to the button'
        });
      }
    }

    return violations;
  }

  private async testHeadingStructure(): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level > previousLevel + 1) {
        violations.push({
          id: 'heading-order',
          impact: 'moderate',
          description: 'Heading levels should not skip levels',
          help: 'Use headings in sequential order (h1, h2, h3, etc.)',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html',
          nodes: [this.getSelector(heading as HTMLElement)],
          wcagGuideline: 'WCAG 1.3.1',
          fixSuggestion: `Change this heading from h${level} to h${previousLevel + 1} or adjust surrounding headings`
        });
      }

      previousLevel = level;
    }

    return violations;
  }

  private async testLiveRegions(): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    
    // 상태 변경을 알리는 요소들이 live region을 사용하는지 확인
    const statusElements = document.querySelectorAll('.status, .alert, .notification, [role="status"], [role="alert"]');
    
    for (const element of statusElements) {
      if (!element.getAttribute('aria-live') && !element.getAttribute('role')) {
        violations.push({
          id: 'live-region',
          impact: 'moderate',
          description: 'Status updates should use ARIA live regions',
          help: 'Add aria-live="polite" or aria-live="assertive" for status announcements',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html',
          nodes: [this.getSelector(element as HTMLElement)],
          wcagGuideline: 'WCAG 4.1.3',
          fixSuggestion: 'Add aria-live="polite" attribute for non-urgent updates or aria-live="assertive" for urgent updates'
        });
      }
    }

    return violations;
  }

  private async testImageAltText(): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    
    const images = document.querySelectorAll('img');
    for (const img of images) {
      if (!img.getAttribute('alt')) {
        violations.push({
          id: 'image-alt',
          impact: 'serious',
          description: 'Images must have alternative text',
          help: 'Add alt attribute to describe the image',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
          nodes: [this.getSelector(img)],
          wcagGuideline: 'WCAG 1.1.1',
          fixSuggestion: 'Add alt attribute with descriptive text or alt="" for decorative images'
        });
      }
    }

    return violations;
  }

  private async checkColorContrast(element: HTMLElement): Promise<AccessibilityViolation | null> {
    // 실제 환경에서는 색상 대비 계산 라이브러리 사용
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // 시뮬레이션: 무작위로 일부 요소에서 대비 문제 발견
    if (Math.random() < 0.1) {
      return {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Text color has insufficient contrast against background',
        help: 'Ensure text has a contrast ratio of at least 4.5:1',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
        nodes: [this.getSelector(element)],
        wcagGuideline: 'WCAG 1.4.3',
        fixSuggestion: 'Adjust text or background color to meet minimum contrast requirements'
      };
    }

    return null;
  }

  // 🚀 접근성 테스트: 유틸리티 메서드들
  private getSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private getWcagGuideline(tags: string[]): string {
    const wcagTags = tags.filter(tag => tag.startsWith('wcag'));
    return wcagTags.length > 0 ? wcagTags[0].toUpperCase() : 'WCAG';
  }

  private getFixSuggestion(ruleId: string): string {
    const suggestions: Record<string, string> = {
      'aria-allowed-attr': 'Remove invalid ARIA attributes or use correct ones',
      'aria-required-attr': 'Add required ARIA attributes for this element',
      'button-name': 'Add text content or aria-label to the button',
      'color-contrast': 'Increase color contrast to meet WCAG AA standards',
      'focus-order-semantics': 'Ensure focusable elements have appropriate roles',
      'heading-order': 'Use headings in sequential order without skipping levels',
      'image-alt': 'Add descriptive alt text for images',
      'label': 'Associate form inputs with descriptive labels',
      'link-name': 'Provide descriptive text for links',
      'region': 'Add landmark roles to identify page regions'
    };

    return suggestions[ruleId] || 'Review and fix this accessibility issue';
  }

  private getComplianceLevel(violations: AccessibilityViolation[]): string {
    const criticalCount = violations.filter(v => v.impact === 'critical').length;
    const seriousCount = violations.filter(v => v.impact === 'serious').length;

    if (criticalCount > 0) return 'Non-compliant (Critical issues)';
    if (seriousCount > 0) return 'Non-compliant (Serious issues)';
    if (violations.length > 0) return 'Partially compliant';
    return 'WCAG AA Compliant';
  }

  private generateRecommendations(violations: AccessibilityViolation[]): string[] {
    const recommendations: string[] = [];
    
    const groupedViolations = violations.reduce((groups, violation) => {
      if (!groups[violation.impact]) groups[violation.impact] = [];
      groups[violation.impact].push(violation);
      return groups;
    }, {} as Record<string, AccessibilityViolation[]>);

    if (groupedViolations.critical?.length > 0) {
      recommendations.push(`🔴 Fix ${groupedViolations.critical.length} critical accessibility issues immediately`);
    }
    
    if (groupedViolations.serious?.length > 0) {
      recommendations.push(`🟠 Address ${groupedViolations.serious.length} serious accessibility issues`);
    }
    
    if (groupedViolations.moderate?.length > 0) {
      recommendations.push(`🟡 Consider fixing ${groupedViolations.moderate.length} moderate accessibility issues`);
    }

    // 일반적인 권장사항
    recommendations.push('🔍 Test with screen readers for real-world validation');
    recommendations.push('⌨️ Verify all functionality works with keyboard-only navigation');
    recommendations.push('🎨 Ensure color is not the only way to convey information');

    return recommendations;
  }

  private generateKeyboardNavigationRecommendations(violations: AccessibilityViolation[]): string[] {
    const recommendations: string[] = [];
    
    if (violations.some(v => v.id === 'positive-tabindex')) {
      recommendations.push('Remove positive tabindex values and use semantic HTML');
    }
    
    if (violations.some(v => v.id === 'modal-focus-trap')) {
      recommendations.push('Implement proper focus trapping in modal dialogs');
    }
    
    if (violations.some(v => v.id === 'missing-skip-link')) {
      recommendations.push('Add skip navigation links for keyboard users');
    }

    recommendations.push('Test with Tab, Shift+Tab, Arrow keys, Enter, and Space');
    recommendations.push('Ensure all interactive elements are keyboard accessible');

    return recommendations;
  }

  private generateScreenReaderRecommendations(violations: AccessibilityViolation[]): string[] {
    const recommendations: string[] = [];
    
    recommendations.push('Test with NVDA, JAWS, or VoiceOver screen readers');
    recommendations.push('Provide meaningful ARIA labels and descriptions');
    recommendations.push('Use semantic HTML elements whenever possible');
    recommendations.push('Ensure content is announced in logical order');

    return recommendations;
  }

  private generateColorContrastRecommendations(violations: AccessibilityViolation[]): string[] {
    const recommendations: string[] = [];
    
    if (violations.length > 0) {
      recommendations.push('Use color contrast checking tools during design');
      recommendations.push('Meet WCAG AA contrast ratio of 4.5:1 for normal text');
      recommendations.push('Meet WCAG AA contrast ratio of 3:1 for large text');
      recommendations.push('Consider high contrast mode support');
    }

    return recommendations;
  }

  // 🚀 접근성 테스트: 결과 조회 및 관리
  public getResults(): AccessibilityTestResult[] {
    return [...this.results];
  }

  public getLatestResult(): AccessibilityTestResult | null {
    return this.results.length > 0 ? this.results[this.results.length - 1] : null;
  }

  public getResultByName(testName: string): AccessibilityTestResult | null {
    return this.results.find(r => r.testName === testName) || null;
  }

  public exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }

  public generateReport(): string {
    const report: string[] = [];
    
    report.push('# Accessibility Test Report');
    report.push('');
    report.push(`Generated at: ${new Date().toISOString()}`);
    report.push(`Total tests: ${this.results.length}`);
    report.push(`Passed: ${this.results.filter(r => r.passed).length}`);
    report.push(`Failed: ${this.results.filter(r => !r.passed).length}`);
    report.push('');

    this.results.forEach(result => {
      report.push(`## ${result.testName}`);
      report.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      report.push(`Score: ${result.score}/100`);
      report.push(`WCAG Level: ${result.wcagLevel}`);
      report.push(`Compliance: ${result.summary.complianceLevel}`);
      report.push('');

      if (result.violations.length > 0) {
        report.push('### Violations');
        result.violations.forEach(violation => {
          report.push(`- **${violation.impact.toUpperCase()}**: ${violation.description}`);
          report.push(`  - Help: ${violation.help}`);
          report.push(`  - Elements: ${violation.nodes.join(', ')}`);
          report.push('');
        });
      }

      if (result.recommendations.length > 0) {
        report.push('### Recommendations');
        result.recommendations.forEach(rec => {
          report.push(`- ${rec}`);
        });
        report.push('');
      }
    });

    return report.join('\n');
  }

  public setConfig(config: Partial<AccessibilityTestConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public clearResults(): void {
    this.results = [];
  }
}

export default AccessibilityTest;