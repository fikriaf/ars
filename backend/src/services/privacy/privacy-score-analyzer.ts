/**
 * Privacy Score Analyzer
 * 
 * Analyzes wallet privacy posture and provides recommendations for improvement.
 * Tracks privacy scores over time and alerts when scores drop below threshold.
 * 
 * Phase 2: MEV-Protected Rebalancing
 * Task 8.2: Implement PrivacyScoreAnalyzer class
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SipherClient } from './sipher/sipher-client';
import { PrivacyScore } from './types';

/**
 * Simple logger utility
 */
const logger = {
  info: (message: string, context?: any) => console.log(`[INFO] ${message}`, context || ''),
  warn: (message: string, context?: any) => console.warn(`[WARN] ${message}`, context || ''),
  error: (message: string, context?: any) => console.error(`[ERROR] ${message}`, context || '')
};

/**
 * Privacy score record from database
 */
export interface PrivacyScoreRecord {
  id: number;
  address: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: string[];
  recommendations?: string[];
  analyzed_at: Date;
}

/**
 * Privacy score trend data
 */
export interface PrivacyScoreTrend {
  address: string;
  scores: Array<{
    score: number;
    grade: string;
    analyzed_at: Date;
  }>;
  averageScore: number;
  trend: 'improving' | 'stable' | 'degrading';
}

/**
 * Privacy Score Analyzer
 * 
 * Provides methods for:
 * - Analyzing wallet privacy scores
 * - Storing privacy scores in database
 * - Tracking score trends over time
 * - Alerting when scores drop below threshold
 * - Providing improvement recommendations
 */
export class PrivacyScoreAnalyzer {
  private sipherClient: SipherClient;
  private database: SupabaseClient;
  private readonly PRIVACY_THRESHOLD = 70; // Minimum acceptable privacy score

  /**
   * Create a new PrivacyScoreAnalyzer
   * 
   * @param sipherClient - Sipher API client
   * @param database - Supabase database client
   */
  constructor(
    sipherClient: SipherClient,
    database: SupabaseClient
  ) {
    this.sipherClient = sipherClient;
    this.database = database;
  }

  /**
   * Analyze privacy score for an address
   * 
   * Calls Sipher API to analyze wallet privacy posture and stores the result.
   * Returns score (0-100), grade (A-F), factors, and recommendations.
   * 
   * Requirements: 9.1, 9.2
   * 
   * @param address - Wallet/vault address to analyze
   * @param limit - Optional transaction limit for analysis
   * @returns Privacy score analysis
   */
  async analyzePrivacy(address: string, limit?: number): Promise<PrivacyScoreRecord> {
    try {
      logger.info('Analyzing privacy score', { address, limit });

      // Call Sipher API to analyze privacy
      const privacyScore: PrivacyScore = await this.sipherClient.analyzePrivacy(
        address,
        limit
      );

      // Store in database
      const record = await this.storePrivacyScore(privacyScore);

      // Check if score is below threshold
      if (privacyScore.score < this.PRIVACY_THRESHOLD) {
        await this.alertLowPrivacyScore(address, privacyScore.score);
      }

      logger.info('Privacy analysis complete', {
        address,
        score: privacyScore.score,
        grade: privacyScore.grade
      });

      return record;
    } catch (error) {
      logger.error('Failed to analyze privacy', { error, address });
      throw error;
    }
  }

  /**
   * Get latest privacy score for an address
   * 
   * @param address - Wallet/vault address
   * @returns Latest privacy score record or null if not found
   */
  async getLatestScore(address: string): Promise<PrivacyScoreRecord | null> {
    try {
      const { data, error } = await this.database
        .from('privacy_scores')
        .select('*')
        .eq('address', address)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        logger.error('Failed to retrieve privacy score', { error, address });
        throw new Error(`Database error: ${error.message}`);
      }

      return this.mapToRecord(data);
    } catch (error) {
      logger.error('Failed to get latest privacy score', { error, address });
      throw error;
    }
  }

  /**
   * Get privacy score trend for an address
   * 
   * Retrieves historical privacy scores and calculates trend.
   * 
   * Requirements: 9.4, 9.5
   * 
   * @param address - Wallet/vault address
   * @param limit - Number of historical scores to retrieve (default 10)
   * @returns Privacy score trend data
   */
  async getScoreTrend(address: string, limit: number = 10): Promise<PrivacyScoreTrend> {
    try {
      logger.info('Retrieving privacy score trend', { address, limit });

      const { data, error } = await this.database
        .from('privacy_scores')
        .select('score, grade, analyzed_at')
        .eq('address', address)
        .order('analyzed_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to retrieve privacy score trend', { error, address });
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return {
          address,
          scores: [],
          averageScore: 0,
          trend: 'stable'
        };
      }

      // Calculate average score
      const scores = data.map(record => ({
        score: record.score,
        grade: record.grade,
        analyzed_at: new Date(record.analyzed_at)
      }));

      const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

      // Determine trend (compare first half to second half)
      const trend = this.calculateTrend(scores.map(s => s.score));

      return {
        address,
        scores,
        averageScore,
        trend
      };
    } catch (error) {
      logger.error('Failed to get privacy score trend', { error, address });
      throw error;
    }
  }

  /**
   * Check if address needs enhanced MEV protection
   * 
   * Returns true if privacy score is below threshold (70).
   * 
   * Requirements: 9.3
   * 
   * @param address - Wallet/vault address
   * @returns True if enhanced protection needed
   */
  async needsEnhancedProtection(address: string): Promise<boolean> {
    try {
      const latestScore = await this.getLatestScore(address);

      if (!latestScore) {
        // No score available, analyze now
        const newScore = await this.analyzePrivacy(address);
        return newScore.score < this.PRIVACY_THRESHOLD;
      }

      // Check if score is below threshold
      const needsProtection = latestScore.score < this.PRIVACY_THRESHOLD;

      if (needsProtection) {
        logger.warn('Address needs enhanced MEV protection', {
          address,
          score: latestScore.score,
          threshold: this.PRIVACY_THRESHOLD
        });
      }

      return needsProtection;
    } catch (error) {
      logger.error('Failed to check protection needs', { error, address });
      throw error;
    }
  }

  /**
   * Get all addresses with low privacy scores
   * 
   * Returns addresses with scores below threshold that need enhanced protection.
   * 
   * Requirements: 9.3, 9.4
   * 
   * @returns Array of addresses with low privacy scores
   */
  async getLowPrivacyAddresses(): Promise<PrivacyScoreRecord[]> {
    try {
      logger.info('Retrieving addresses with low privacy scores', {
        threshold: this.PRIVACY_THRESHOLD
      });

      // Get latest score for each unique address
      const { data, error } = await this.database
        .from('privacy_scores')
        .select('*')
        .lt('score', this.PRIVACY_THRESHOLD)
        .order('analyzed_at', { ascending: false });

      if (error) {
        logger.error('Failed to retrieve low privacy addresses', { error });
        throw new Error(`Database error: ${error.message}`);
      }

      // Filter to get only the latest score for each address
      const latestScores = new Map<string, any>();
      for (const record of data) {
        if (!latestScores.has(record.address)) {
          latestScores.set(record.address, record);
        }
      }

      const records = Array.from(latestScores.values()).map(this.mapToRecord);

      logger.info('Found addresses with low privacy scores', { count: records.length });

      return records;
    } catch (error) {
      logger.error('Failed to get low privacy addresses', { error });
      throw error;
    }
  }

  /**
   * Store privacy score in database
   * 
   * @param privacyScore - Privacy score from Sipher API
   * @returns Stored privacy score record
   */
  private async storePrivacyScore(privacyScore: PrivacyScore): Promise<PrivacyScoreRecord> {
    try {
      const { data, error } = await this.database
        .from('privacy_scores')
        .insert({
          address: privacyScore.address,
          score: privacyScore.score,
          grade: privacyScore.grade,
          factors: privacyScore.factors,
          recommendations: privacyScore.recommendations || [],
          analyzed_at: new Date(privacyScore.analyzedAt).toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to store privacy score', { error });
        throw new Error(`Database error: ${error.message}`);
      }

      return this.mapToRecord(data);
    } catch (error) {
      logger.error('Failed to store privacy score', { error });
      throw error;
    }
  }

  /**
   * Alert when privacy score drops below threshold
   * 
   * Requirements: 9.3, 9.4
   * 
   * @param address - Wallet/vault address
   * @param score - Current privacy score
   */
  private async alertLowPrivacyScore(address: string, score: number): Promise<void> {
    logger.warn('⚠️  LOW PRIVACY SCORE ALERT', {
      address,
      score,
      threshold: this.PRIVACY_THRESHOLD,
      message: 'Enhanced MEV protection required'
    });

    // TODO: Integrate with alerting system (Slack, PagerDuty, etc.)
    // For now, just log the alert
  }

  /**
   * Calculate trend from score history
   * 
   * @param scores - Array of scores (newest first)
   * @returns Trend direction
   */
  private calculateTrend(scores: number[]): 'improving' | 'stable' | 'degrading' {
    if (scores.length < 2) {
      return 'stable';
    }

    // Split into two halves
    const midpoint = Math.floor(scores.length / 2);
    const recentHalf = scores.slice(0, midpoint);
    const olderHalf = scores.slice(midpoint);

    // Calculate averages
    const recentAvg = recentHalf.reduce((sum, s) => sum + s, 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, s) => sum + s, 0) / olderHalf.length;

    // Determine trend (5 point threshold for significance)
    const difference = recentAvg - olderAvg;
    if (difference > 5) {
      return 'improving';
    } else if (difference < -5) {
      return 'degrading';
    } else {
      return 'stable';
    }
  }

  /**
   * Map database record to PrivacyScoreRecord
   * 
   * @param data - Database record
   * @returns PrivacyScoreRecord
   */
  private mapToRecord(data: any): PrivacyScoreRecord {
    return {
      id: data.id,
      address: data.address,
      score: data.score,
      grade: data.grade,
      factors: data.factors,
      recommendations: data.recommendations,
      analyzed_at: new Date(data.analyzed_at)
    };
  }
}

/**
 * Create PrivacyScoreAnalyzer instance
 * 
 * @param sipherClient - Sipher API client
 * @param database - Supabase database client
 * @returns PrivacyScoreAnalyzer instance
 */
export function createPrivacyScoreAnalyzer(
  sipherClient: SipherClient,
  database: SupabaseClient
): PrivacyScoreAnalyzer {
  return new PrivacyScoreAnalyzer(sipherClient, database);
}
