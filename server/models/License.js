// 📄 라이센스 데이터 모델 (Prisma 스키마용)
/*
  Prisma 스키마에 추가할 모델들:

  model License {
    id            String   @id @default(cuid())
    licenseKey    String   @unique
    email         String
    orderId       String?  @unique
    subscriptionId String? @unique
    productId     String
    plan          String   // 'trial', 'monthly', 'yearly', 'lifetime'
    status        String   // 'active', 'expired', 'cancelled', 'refunded'
    machineId     String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
    expiresAt     DateTime?
    lastValidated DateTime?
    price         Float?
    currency      String?
    
    // 관계
    validations   LicenseValidation[]
    
    @@map("licenses")
  }

  model LicenseValidation {
    id          String   @id @default(cuid())
    licenseKey  String
    machineId   String
    ipAddress   String?
    userAgent   String?
    validatedAt DateTime @default(now())
    success     Boolean
    errorCode   String?
    
    license     License  @relation(fields: [licenseKey], references: [licenseKey])
    
    @@map("license_validations")
  }

  model Subscription {
    id              String   @id @default(cuid())
    subscriptionId  String   @unique // Gumroad subscription ID
    licenseKey      String   @unique
    email           String
    userId          String?  // Gumroad user ID
    productId       String
    plan            String
    status          String   // 'active', 'cancelled', 'paused'
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
    nextBillingDate DateTime?
    cancelledAt     DateTime?
    
    license         License  @relation(fields: [licenseKey], references: [licenseKey])
    
    @@map("subscriptions")
  }

  model GumroadEvent {
    id        String   @id @default(cuid())
    eventId   String   @unique
    eventType String
    data      Json
    processed Boolean  @default(false)
    createdAt DateTime @default(now())
    
    @@map("gumroad_events")
  }
*/

// 🎯 라이센스 서비스 클래스
class LicenseService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * 🔑 새 라이센스 생성
   */
  async createLicense(data) {
    const {
      licenseKey,
      email,
      orderId,
      subscriptionId,
      productId,
      plan,
      price,
      currency,
      expiresAt
    } = data;

    return await this.prisma.license.create({
      data: {
        licenseKey,
        email,
        orderId,
        subscriptionId,
        productId,
        plan,
        status: 'active',
        price,
        currency,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });
  }

  /**
   * 🔍 라이센스 조회
   */
  async findLicense(licenseKey) {
    return await this.prisma.license.findUnique({
      where: { licenseKey },
      include: {
        validations: {
          orderBy: { validatedAt: 'desc' },
          take: 10 // 최근 10개만
        }
      }
    });
  }

  /**
   * ✅ 라이센스 검증
   */
  async validateLicense(licenseKey, machineId, ipAddress, userAgent) {
    const license = await this.findLicense(licenseKey);
    
    if (!license) {
      await this.logValidation(licenseKey, machineId, ipAddress, userAgent, false, 'LICENSE_NOT_FOUND');
      return { valid: false, error: 'License not found' };
    }

    // 상태 확인
    if (license.status !== 'active') {
      await this.logValidation(licenseKey, machineId, ipAddress, userAgent, false, 'LICENSE_INACTIVE');
      return { valid: false, error: 'License is not active' };
    }

    // 만료일 확인
    if (license.expiresAt && new Date() > license.expiresAt) {
      await this.updateLicenseStatus(licenseKey, 'expired');
      await this.logValidation(licenseKey, machineId, ipAddress, userAgent, false, 'LICENSE_EXPIRED');
      return { valid: false, error: 'License expired' };
    }

    // 기기 바인딩 확인
    if (license.machineId && license.machineId !== machineId) {
      await this.logValidation(licenseKey, machineId, ipAddress, userAgent, false, 'MACHINE_MISMATCH');
      return { valid: false, error: 'License is bound to another device' };
    }

    // 첫 번째 활성화인 경우 기기 바인딩
    if (!license.machineId) {
      await this.bindLicenseToMachine(licenseKey, machineId);
    }

    // 마지막 검증 시간 업데이트
    await this.updateLastValidated(licenseKey);
    await this.logValidation(licenseKey, machineId, ipAddress, userAgent, true);

    return {
      valid: true,
      license: {
        plan: license.plan,
        expiresAt: license.expiresAt,
        email: license.email
      }
    };
  }

  /**
   * 🔗 기기 바인딩
   */
  async bindLicenseToMachine(licenseKey, machineId) {
    return await this.prisma.license.update({
      where: { licenseKey },
      data: { machineId }
    });
  }

  /**
   * 🕒 마지막 검증 시간 업데이트
   */
  async updateLastValidated(licenseKey) {
    return await this.prisma.license.update({
      where: { licenseKey },
      data: { lastValidated: new Date() }
    });
  }

  /**
   * 📊 라이센스 상태 업데이트
   */
  async updateLicenseStatus(licenseKey, status) {
    return await this.prisma.license.update({
      where: { licenseKey },
      data: { status }
    });
  }

  /**
   * 📝 검증 로그 기록
   */
  async logValidation(licenseKey, machineId, ipAddress, userAgent, success, errorCode = null) {
    return await this.prisma.licenseValidation.create({
      data: {
        licenseKey,
        machineId,
        ipAddress,
        userAgent,
        success,
        errorCode
      }
    });
  }

  /**
   * 🔄 라이센스 갱신
   */
  async renewLicense(licenseKey, newExpiresAt) {
    return await this.prisma.license.update({
      where: { licenseKey },
      data: {
        expiresAt: new Date(newExpiresAt),
        status: 'active'
      }
    });
  }

  /**
   * ❌ 라이센스 취소
   */
  async cancelLicense(licenseKey) {
    return await this.prisma.license.update({
      where: { licenseKey },
      data: { status: 'cancelled' }
    });
  }

  /**
   * 📧 이메일로 라이센스 조회
   */
  async findLicensesByEmail(email) {
    return await this.prisma.license.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * 📊 라이센스 통계
   */
  async getLicenseStats() {
    const [total, active, expired, trial] = await Promise.all([
      this.prisma.license.count(),
      this.prisma.license.count({ where: { status: 'active' } }),
      this.prisma.license.count({ where: { status: 'expired' } }),
      this.prisma.license.count({ where: { plan: 'trial' } })
    ]);

    return { total, active, expired, trial };
  }

  /**
   * 🔍 만료 예정 라이센스 조회
   */
  async getExpiringLicenses(days = 7) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return await this.prisma.license.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lte: expiryDate,
          gte: new Date()
        }
      }
    });
  }

  /**
   * 🗑️ 만료된 라이센스 정리
   */
  async cleanupExpiredLicenses() {
    return await this.prisma.license.updateMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: new Date()
        }
      },
      data: { status: 'expired' }
    });
  }
}

module.exports = LicenseService;