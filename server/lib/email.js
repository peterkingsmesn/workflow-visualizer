const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

// SendGrid API 키 설정
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@workflow-visualizer.com';
const FROM_NAME = process.env.FROM_NAME || 'Workflow Visualizer';

/**
 * 이메일 템플릿 로드
 */
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8');
  }
  return null;
};

/**
 * 템플릿 변수 치환
 */
const processTemplate = (template, variables) => {
  let processedTemplate = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedTemplate = processedTemplate.replace(regex, value);
  }
  
  return processedTemplate;
};

/**
 * 이메일 전송 함수
 */
const sendEmail = async (to, subject, html, text = null) => {
  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // HTML 태그 제거
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 이메일 인증 메일 발송
 */
const sendVerificationEmail = async (email, name, verificationToken) => {
  const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${verificationToken}`;
  
  const template = loadTemplate('email-verification');
  const html = template ? processTemplate(template, {
    name,
    verificationUrl,
    appName: 'Workflow Visualizer',
    appUrl: process.env.APP_URL
  }) : `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>이메일 인증</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Workflow Visualizer</h1>
        </div>
        <div class="content">
          <h2>안녕하세요, ${name}님!</h2>
          <p>Workflow Visualizer에 가입해주셔서 감사합니다.</p>
          <p>아래 버튼을 클릭하여 이메일 주소를 인증해주세요:</p>
          <a href="${verificationUrl}" class="button">이메일 인증하기</a>
          <p>또는 다음 링크를 복사하여 브라우저에 붙여넣으세요:</p>
          <p><small>${verificationUrl}</small></p>
          <p>이 링크는 24시간 동안 유효합니다.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Workflow Visualizer. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, 'Workflow Visualizer 이메일 인증', html);
};

/**
 * 비밀번호 재설정 메일 발송
 */
const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${resetToken}`;
  
  const template = loadTemplate('password-reset');
  const html = template ? processTemplate(template, {
    name,
    resetUrl,
    appName: 'Workflow Visualizer',
    appUrl: process.env.APP_URL
  }) : `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>비밀번호 재설정</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Workflow Visualizer</h1>
        </div>
        <div class="content">
          <h2>안녕하세요, ${name}님!</h2>
          <p>비밀번호 재설정을 요청하셨습니다.</p>
          <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요:</p>
          <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
          <p>또는 다음 링크를 복사하여 브라우저에 붙여넣으세요:</p>
          <p><small>${resetUrl}</small></p>
          <div class="warning">
            <strong>보안 알림:</strong>
            <ul>
              <li>이 링크는 1시간 동안만 유효합니다.</li>
              <li>비밀번호 재설정을 요청하지 않으셨다면 이 메일을 무시하세요.</li>
              <li>계정 보안을 위해 강력한 비밀번호를 사용하세요.</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 Workflow Visualizer. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, 'Workflow Visualizer 비밀번호 재설정', html);
};

/**
 * 환영 메일 발송
 */
const sendWelcomeEmail = async (email, name) => {
  const template = loadTemplate('welcome');
  const html = template ? processTemplate(template, {
    name,
    appName: 'Workflow Visualizer',
    appUrl: process.env.APP_URL,
    dashboardUrl: `${process.env.APP_URL}/dashboard`,
    featuresUrl: `${process.env.APP_URL}/features`,
    supportUrl: `${process.env.APP_URL}/support`
  }) : `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>환영합니다!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .feature { margin: 15px 0; padding: 10px; border-left: 4px solid #4F46E5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>환영합니다!</h1>
        </div>
        <div class="content">
          <h2>안녕하세요, ${name}님!</h2>
          <p>Workflow Visualizer에 오신 것을 환영합니다! 🎉</p>
          <p>이제 강력한 코드베이스 분석 도구를 사용하실 수 있습니다.</p>
          
          <div class="features">
            <h3>주요 기능:</h3>
            <div class="feature">
              <strong>🔍 AI 기반 코드 분석</strong><br>
              복잡한 코드베이스를 자동으로 분석하고 시각화합니다.
            </div>
            <div class="feature">
              <strong>📊 워크플로우 시각화</strong><br>
              데이터 흐름과 API 호출을 직관적으로 확인할 수 있습니다.
            </div>
            <div class="feature">
              <strong>🤝 실시간 협업</strong><br>
              팀원들과 실시간으로 프로젝트를 분석하고 공유하세요.
            </div>
            <div class="feature">
              <strong>🌐 다국어 지원</strong><br>
              한국어, 영어, 일본어 등 다양한 언어를 지원합니다.
            </div>
          </div>
          
          <p>지금 바로 시작해보세요:</p>
          <a href="${process.env.APP_URL}/dashboard" class="button">대시보드로 이동</a>
          
          <p>궁금한 점이 있으시면 언제든지 문의해주세요!</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Workflow Visualizer. All rights reserved.</p>
          <p><a href="${process.env.APP_URL}/support" style="color: #ccc;">지원 센터</a> | <a href="${process.env.APP_URL}/privacy" style="color: #ccc;">개인정보처리방침</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, 'Workflow Visualizer에 오신 것을 환영합니다!', html);
};

/**
 * 구독 알림 메일 발송
 */
const sendSubscriptionEmail = async (email, name, subscriptionData) => {
  const { plan, status, amount, nextBillingDate } = subscriptionData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>구독 알림</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .subscription-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .status-active { color: #059669; font-weight: bold; }
        .status-canceled { color: #DC2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>구독 알림</h1>
        </div>
        <div class="content">
          <h2>안녕하세요, ${name}님!</h2>
          <p>구독 정보가 업데이트되었습니다.</p>
          
          <div class="subscription-info">
            <h3>구독 정보:</h3>
            <p><strong>플랜:</strong> ${plan}</p>
            <p><strong>상태:</strong> <span class="status-${status}">${status === 'active' ? '활성' : '취소됨'}</span></p>
            ${amount ? `<p><strong>금액:</strong> $${amount}</p>` : ''}
            ${nextBillingDate ? `<p><strong>다음 결제일:</strong> ${nextBillingDate}</p>` : ''}
          </div>
          
          <p>구독 관리는 대시보드에서 하실 수 있습니다:</p>
          <a href="${process.env.APP_URL}/billing" class="button">결제 정보 관리</a>
        </div>
        <div class="footer">
          <p>&copy; 2024 Workflow Visualizer. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, 'Workflow Visualizer 구독 알림', html);
};

/**
 * 사용량 알림 메일 발송
 */
const sendUsageAlertEmail = async (email, name, usageData) => {
  const { usageType, currentUsage, limit, percentage } = usageData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>사용량 알림</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F59E0B; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .usage-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>사용량 알림</h1>
        </div>
        <div class="content">
          <h2>안녕하세요, ${name}님!</h2>
          <p>사용량이 한도에 근접했습니다.</p>
          
          <div class="usage-info">
            <h3>사용량 정보:</h3>
            <p><strong>항목:</strong> ${usageType}</p>
            <p><strong>현재 사용량:</strong> ${currentUsage}</p>
            <p><strong>한도:</strong> ${limit}</p>
            <p><strong>사용률:</strong> ${percentage}%</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ 주의:</strong> 사용량이 한도를 초과하면 서비스 이용이 제한될 수 있습니다.
            플랜 업그레이드를 고려해보세요.
          </div>
          
          <a href="${process.env.APP_URL}/pricing" class="button">플랜 업그레이드</a>
        </div>
        <div class="footer">
          <p>&copy; 2024 Workflow Visualizer. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, 'Workflow Visualizer 사용량 알림', html);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendSubscriptionEmail,
  sendUsageAlertEmail
};