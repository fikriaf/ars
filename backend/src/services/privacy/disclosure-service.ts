import { SupabaseClient } from '@supabase/supabase-js';
import { SipherClient, ViewingKey } from './sipher-client';

/**
 * Simple logger utility
 */
const logger = {
  info: (message: string, context?: any) => console.log(`[INFO] ${message}`, context || ''),
  warn: (message: string, context?: any) => console.warn(`[WARN] ${message}`, context || ''),
  error: (message: string, context?: any) => console.error(`[ERROR] ${message}`, context || '')
};

/**
 * Disclosure record from database
 */
export interface DisclosureRecord {
  id: number;
  transactionId: number;
  auditorId: string;
  viewingKeyHash: string;
  encryptedData: string;
  disclosedFields: string[];
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

/**
 * Decrypted transaction data
 */
export interface DecryptedTransactionData {
  sender: string;
  recipient: string;
  amount: string;
  timestamp: number;
  txSignature?: string;
}

/**
 * Disclosure Service
 * 
 * Manages selective transaction disclosure to auditors with encrypted data
 * and time-limited access.
 * 
 * Features:
 * - Encrypt transaction data with auditor's public key
 * - Decrypt disclosed data with viewing key
 * - List disclosures for auditor
 * - Revoke disclosures
 * - Enforce expiration validation
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.4
 */
export class DisclosureService {
  private sipherClient: SipherClient;
  private database: SupabaseClient;

  constructor(
    sipherClient: SipherClient,
    database: SupabaseClient
  ) {
    this.sipherClient = sipherClient;
    this.database = database;
  }

  /**
   * Encrypt transaction data for disclosure to auditor
   * 
   * @param transactionData - Transaction data to disclose
   * @param viewingKey - Viewing key for disclosure
   * @param auditorPublicKey - Auditor's public key for encryption
   * @returns Encrypted data, key hash, and expiration
   */
  async encrypt(
    transactionData: any,
    viewingKey: ViewingKey,
    auditorPublicKey: string
  ): Promise<{
    encrypted: string;
    keyHash: string;
    expiresAt: Date;
  }> {
    try {
      logger.info('Encrypting transaction data for disclosure', {
        viewingKeyHash: viewingKey.hash,
        auditorPublicKey: auditorPublicKey.substring(0, 10) + '...'
      });

      // Call Sipher API to encrypt data with viewing key
      const result = await this.sipherClient.disclose({
        viewingKey,
        transactionData
      });

      // Calculate expiration (default 30 days)
      const expirationDays = parseInt(
        process.env.VIEWING_KEY_EXPIRATION_DAYS || '30',
        10
      );
      const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

      logger.info('Transaction data encrypted successfully', {
        keyHash: result.keyHash,
        expiresAt
      });

      return {
        encrypted: result.encrypted,
        keyHash: result.keyHash,
        expiresAt: new Date(result.expiresAt)
      };
    } catch (error) {
      logger.error('Failed to encrypt transaction data', { error });
      throw error;
    }
  }

  /**
   * Decrypt disclosed transaction data with viewing key
   * 
   * @param encrypted - Encrypted transaction data
   * @param viewingKey - Viewing key for decryption
   * @returns Decrypted transaction data
   */
  async decrypt(
    encrypted: string,
    viewingKey: ViewingKey
  ): Promise<DecryptedTransactionData> {
    try {
      logger.info('Decrypting disclosed transaction data', {
        viewingKeyHash: viewingKey.hash
      });

      // Call Sipher API to decrypt data with viewing key
      const decrypted = await this.sipherClient.decrypt({
        viewingKey,
        encrypted
      });

      logger.info('Transaction data decrypted successfully');

      return {
        sender: decrypted.sender,
        recipient: decrypted.recipient,
        amount: decrypted.amount,
        timestamp: decrypted.timestamp,
        txSignature: decrypted.txSignature
      };
    } catch (error) {
      logger.error('Failed to decrypt transaction data', { error });
      throw error;
    }
  }

  /**
   * List all disclosures for an auditor
   * 
   * @param auditorId - Auditor identifier
   * @returns Array of disclosure records
   */
  async listDisclosures(auditorId: string): Promise<DisclosureRecord[]> {
    try {
      logger.info(`Listing disclosures for auditor: ${auditorId}`);

      const { data, error } = await this.database
        .from('disclosures')
        .select('*')
        .eq('auditor_id', auditorId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const records = (data || []).map(this.mapToRecord);

      logger.info(`Found ${records.length} disclosures for auditor ${auditorId}`);

      return records;
    } catch (error) {
      logger.error('Failed to list disclosures', { error, auditorId });
      throw error;
    }
  }

  /**
   * Revoke a disclosure
   * 
   * @param disclosureId - Disclosure ID to revoke
   */
  async revokeDisclosure(disclosureId: number): Promise<void> {
    try {
      logger.info(`Revoking disclosure: ${disclosureId}`);

      const { error } = await this.database
        .from('disclosures')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', disclosureId);

      if (error) {
        throw error;
      }

      // Log revocation event
      await this.logDisclosureEvent({
        type: 'revocation',
        disclosureId,
        timestamp: new Date()
      });

      logger.info(`Disclosure revoked: ${disclosureId}`);
    } catch (error) {
      logger.error('Failed to revoke disclosure', { error, disclosureId });
      throw error;
    }
  }

  /**
   * Validate disclosure expiration
   * 
   * @param expiresAt - Expiration timestamp
   * @returns True if not expired
   */
  async validateExpiration(expiresAt: Date): Promise<boolean> {
    const now = new Date();
    const isValid = expiresAt > now;

    if (!isValid) {
      logger.warn('Disclosure has expired', {
        expiresAt,
        now
      });
    }

    return isValid;
  }

  /**
   * Log disclosure event for audit trail
   * 
   * @param event - Disclosure event details
   */
  private async logDisclosureEvent(event: any): Promise<void> {
    try {
      // In production, this should write to a dedicated audit log table
      // or external audit logging service
      logger.info('Disclosure event logged', event);

      // TODO: Implement proper audit logging
      // await this.database.from('audit_log').insert({
      //   event_type: event.type,
      //   disclosure_id: event.disclosureId,
      //   timestamp: event.timestamp.toISOString(),
      //   details: JSON.stringify(event)
      // });
    } catch (error) {
      logger.error('Failed to log disclosure event', { error, event });
      // Don't throw - logging failure shouldn't break the operation
    }
  }

  /**
   * Map database row to DisclosureRecord
   * 
   * @param data - Database row
   * @returns Disclosure record
   */
  private mapToRecord(data: any): DisclosureRecord {
    return {
      id: data.id,
      transactionId: data.transaction_id,
      auditorId: data.auditor_id,
      viewingKeyHash: data.viewing_key_hash,
      encryptedData: data.encrypted_data,
      disclosedFields: data.disclosed_fields,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      revokedAt: data.revoked_at ? new Date(data.revoked_at) : undefined
    };
  }
}

/**
 * Singleton instance
 */
let disclosureServiceInstance: DisclosureService | null = null;

/**
 * Initialize DisclosureService singleton
 * 
 * @param sipherClient - Sipher API client
 * @param database - Supabase client
 * @returns DisclosureService instance
 */
export function initializeDisclosureService(
  sipherClient: SipherClient,
  database: SupabaseClient
): DisclosureService {
  disclosureServiceInstance = new DisclosureService(
    sipherClient,
    database
  );
  return disclosureServiceInstance;
}

/**
 * Get DisclosureService singleton
 * 
 * @returns DisclosureService instance
 * @throws Error if not initialized
 */
export function getDisclosureService(): DisclosureService {
  if (!disclosureServiceInstance) {
    throw new Error('DisclosureService not initialized. Call initializeDisclosureService first.');
  }
  return disclosureServiceInstance;
}
