import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { encryptSecret, decryptSecret, maskKeyId, maskSecret } from '../utils/crypto';
import { PaymentProviderFactory } from './providers/payment.factory';
import { AuditService } from './audit.service';
import { logger } from '../utils/logger';

export interface ConnectGatewayInput {
  provider?: string;
  mode: 'test' | 'live';
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  accountType?: 'standard' | 'route';
  accountId?: string;
}

export class PaymentGatewayService {
  /**
   * Automatically initializes unconfigured Razorpay gateway entry for a new tenant
   */
  static async autoInitTenantGateway(tenantId: string) {
    try {
      const existing = await prisma.tenantPaymentGateway.findUnique({
        where: {
          tenantId_provider: {
            tenantId,
            provider: 'razorpay'
          }
        }
      });

      if (!existing) {
        await prisma.tenantPaymentGateway.create({
          data: {
            tenantId,
            provider: 'razorpay',
            enabled: false,
            mode: 'test',
            connectionStatus: 'not_connected'
          }
        });
        logger.info(`[PAYMENT_GATEWAY] Auto-initialized Razorpay configuration for tenant ${tenantId}`);
      }
    } catch (err: any) {
      logger.error(`[PAYMENT_GATEWAY] Error initializing gateway for tenant ${tenantId}: ${err.message}`);
    }
  }

  /**
   * Retrieves sanitized payment gateway configuration for tenant admin UI
   */
  static async getTenantGatewayConfig(tenantId: string, providerName: string = 'razorpay') {
    if (!tenantId) {
      throw new AppError('Tenant ID is required', 400);
    }

    let gateway = await prisma.tenantPaymentGateway.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: providerName
        }
      }
    });

    if (!gateway) {
      // Auto-provision default entry
      gateway = await prisma.tenantPaymentGateway.create({
        data: {
          tenantId,
          provider: providerName,
          enabled: false,
          mode: 'test',
          connectionStatus: 'not_connected'
        }
      });
    }

    return {
      id: gateway.id,
      tenantId: gateway.tenantId,
      provider: gateway.provider,
      enabled: gateway.enabled,
      mode: gateway.mode,
      connectionStatus: gateway.connectionStatus,
      maskedKeyId: maskKeyId(gateway.keyId),
      maskedSecret: gateway.encryptedKeySecret ? maskSecret(gateway.encryptedKeySecret) : 'Not Configured',
      hasWebhookSecret: Boolean(gateway.webhookSecret),
      accountType: gateway.accountType,
      accountId: gateway.accountId || null,
      connectedAt: gateway.connectedAt,
      updatedAt: gateway.updatedAt
    };
  }

  /**
   * Retrieves active, decrypted credentials for internal server-side operations only.
   * NEVER exposed to frontend / client API.
   */
  static async getDecryptedGateway(tenantId: string, providerName: string = 'razorpay') {
    const gateway = await prisma.tenantPaymentGateway.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: providerName
        }
      }
    });

    if (!gateway || !gateway.enabled || gateway.connectionStatus !== 'connected') {
      return null;
    }

    if (!gateway.keyId || !gateway.encryptedKeySecret) {
      return null;
    }

    let keySecret = '';
    try {
      keySecret = decryptSecret(gateway.encryptedKeySecret);
    } catch (err: any) {
      logger.error(`[PAYMENT_GATEWAY] Failed to decrypt key secret for tenant ${tenantId}: ${err.message}`);
      return null;
    }

    let webhookSecret = '';
    if (gateway.webhookSecret) {
      try {
        webhookSecret = decryptSecret(gateway.webhookSecret);
      } catch {
        webhookSecret = gateway.webhookSecret;
      }
    }

    return {
      gatewayId: gateway.id,
      tenantId: gateway.tenantId,
      provider: gateway.provider,
      mode: gateway.mode,
      keyId: gateway.keyId,
      keySecret,
      webhookSecret,
      accountType: gateway.accountType,
      accountId: gateway.accountId
    };
  }

  /**
   * Test connection credentials without saving
   */
  static async testConnection(input: { provider?: string; keyId: string; keySecret: string; mode?: 'test' | 'live' }) {
    const { provider = 'razorpay', keyId, keySecret, mode = 'test' } = input;
    const paymentProvider = PaymentProviderFactory.getProvider(provider);
    return await paymentProvider.testConnection({ keyId, keySecret, mode });
  }

  /**
   * Test, Encrypt, and Connect Gateway
   */
  static async connectGateway(tenantId: string, input: ConnectGatewayInput, userId?: string) {
    const {
      provider = 'razorpay',
      mode = 'test',
      keyId,
      keySecret,
      webhookSecret,
      accountType = 'standard',
      accountId
    } = input;

    if (!tenantId) {
      throw new AppError('Tenant ID is required', 400);
    }
    if (!keyId || !keySecret) {
      throw new AppError('Razorpay Key ID and Key Secret are required', 400);
    }

    const cleanKeyId = keyId.trim();
    const cleanKeySecret = keySecret.trim();
    const cleanWebhookSecret = (webhookSecret || '').trim();

    // 1. Test connection against Razorpay API
    const paymentProvider = PaymentProviderFactory.getProvider(provider);
    const testResult = await paymentProvider.testConnection({
      keyId: cleanKeyId,
      keySecret: cleanKeySecret,
      mode
    });

    if (!testResult.success) {
      // Mark connection failed
      await prisma.tenantPaymentGateway.upsert({
        where: { tenantId_provider: { tenantId, provider } },
        update: {
          connectionStatus: 'failed',
          enabled: false,
          updatedAt: new Date()
        },
        create: {
          tenantId,
          provider,
          mode,
          connectionStatus: 'failed',
          enabled: false
        }
      });

      throw new AppError(testResult.message || 'Razorpay connection failed. Please verify your credentials.', 400);
    }

    // 2. Encrypt sensitive secrets at rest
    const encryptedKeySecret = encryptSecret(cleanKeySecret);
    const encryptedWebhookSecret = cleanWebhookSecret ? encryptSecret(cleanWebhookSecret) : null;

    // 3. Upsert Gateway Configuration
    const saved = await prisma.tenantPaymentGateway.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider
        }
      },
      update: {
        mode,
        keyId: cleanKeyId,
        encryptedKeySecret,
        webhookSecret: encryptedWebhookSecret,
        connectionStatus: 'connected',
        enabled: true,
        accountType,
        accountId: accountId || null,
        connectedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        tenantId,
        provider,
        mode,
        keyId: cleanKeyId,
        encryptedKeySecret,
        webhookSecret: encryptedWebhookSecret,
        connectionStatus: 'connected',
        enabled: true,
        accountType,
        accountId: accountId || null,
        connectedAt: new Date()
      }
    });

    // Also update Tenant settings json mirror for backwards compatibility
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant) {
      const currentSettings = (tenant.settings as any) || {};
      const updatedGateways = {
        ...(currentSettings.paymentGateways || {}),
        razorpay: {
          enabled: true,
          mode,
          keyId: cleanKeyId,
          status: 'connected',
          connectedAt: new Date()
        }
      };
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          settings: {
            ...currentSettings,
            paymentGateways: updatedGateways
          }
        }
      });
    }

    await AuditService.log({
      tenantId,
      userId: userId || null,
      action: 'PAYMENT_GATEWAY_CONNECTED',
      entityType: 'PAYMENT_GATEWAY',
      entityId: saved.id,
      newValue: {
        provider,
        mode,
        maskedKeyId: maskKeyId(cleanKeyId),
        accountType,
        connectionStatus: 'connected'
      }
    });

    return await this.getTenantGatewayConfig(tenantId, provider);
  }

  /**
   * Switch between Test and Live mode
   */
  static async switchMode(tenantId: string, provider: string = 'razorpay', mode: 'test' | 'live', userId?: string) {
    const gateway = await prisma.tenantPaymentGateway.findUnique({
      where: { tenantId_provider: { tenantId, provider } }
    });

    if (!gateway) {
      throw new AppError('Payment gateway configuration not found', 404);
    }

    const updated = await prisma.tenantPaymentGateway.update({
      where: { id: gateway.id },
      data: {
        mode,
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      tenantId,
      userId: userId || null,
      action: 'PAYMENT_GATEWAY_MODE_CHANGED',
      entityType: 'PAYMENT_GATEWAY',
      entityId: gateway.id,
      oldValue: { mode: gateway.mode },
      newValue: { mode }
    });

    return await this.getTenantGatewayConfig(tenantId, provider);
  }

  /**
   * Toggle Gateway Enabled / Disabled
   */
  static async toggleGateway(tenantId: string, provider: string = 'razorpay', enabled: boolean, userId?: string) {
    const gateway = await prisma.tenantPaymentGateway.findUnique({
      where: { tenantId_provider: { tenantId, provider } }
    });

    if (!gateway) {
      throw new AppError('Payment gateway configuration not found', 404);
    }

    const connectionStatus = enabled
      ? (gateway.encryptedKeySecret ? 'connected' : 'not_connected')
      : 'disabled';

    const updated = await prisma.tenantPaymentGateway.update({
      where: { id: gateway.id },
      data: {
        enabled,
        connectionStatus,
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      tenantId,
      userId: userId || null,
      action: enabled ? 'PAYMENT_GATEWAY_ENABLED' : 'PAYMENT_GATEWAY_DISABLED',
      entityType: 'PAYMENT_GATEWAY',
      entityId: gateway.id,
      newValue: { enabled, connectionStatus }
    });

    return await this.getTenantGatewayConfig(tenantId, provider);
  }
}
