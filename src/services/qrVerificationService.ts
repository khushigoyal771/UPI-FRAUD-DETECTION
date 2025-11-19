import { supabase } from "@/integrations/supabase/client";
import CryptoJS from "crypto-js";

interface VerificationResult {
  qrData: string;
  isAuthentic: boolean;
  isDuplicate: boolean;
  isSuspiciousVelocity: boolean;
  productInfo?: {
    productName: string;
    manufacturer: string;
    batchNumber?: string;
  };
  timestamp: string;
}

export class QRVerificationService {
  // Generate SHA-256 hash of QR code data
  static generateHash(qrData: string): string {
    return CryptoJS.SHA256(qrData).toString();
  }

  // Check if QR code has been scanned recently (duplicate detection)
  static async checkDuplicateScan(qrHash: string): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('qr_scan_history')
      .select('id')
      .eq('qr_code_hash', qrHash)
      .gte('scan_timestamp', fiveMinutesAgo)
      .limit(1);

    if (error) {
      console.error('Error checking duplicate scan:', error);
      return false;
    }

    return (data && data.length > 0) || false;
  }

  // Check for suspicious velocity (multiple scans in impossible timeframe)
  static async checkSuspiciousVelocity(qrHash: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('qr_scan_history')
      .select('id, scan_location')
      .eq('qr_code_hash', qrHash)
      .gte('scan_timestamp', oneHourAgo);

    if (error) {
      console.error('Error checking velocity:', error);
      return false;
    }

    // If scanned more than 3 times in the last hour, flag as suspicious
    return (data && data.length > 3) || false;
  }

  // Verify QR code based on phone number verification
  static async verifyQRCode(qrData: string, userContact?: string): Promise<VerificationResult> {
    const qrHash = this.generateHash(qrData);
    const timestamp = new Date().toISOString();

    // Check if phone number is verified/genuine
    let isAuthentic = false;
    let phoneVerified = false;
    
    if (userContact) {
      const { data: phoneData, error: phoneError } = await supabase
        .from('verified_phone_numbers')
        .select('*')
        .eq('phone_number', userContact)
        .eq('is_active', true)
        .maybeSingle();

      if (phoneError) {
        console.error('Error checking phone number:', phoneError);
      }

      phoneVerified = !!phoneData;
      isAuthentic = phoneVerified; // Authentic if phone number is verified
    }

    const isDuplicate = await this.checkDuplicateScan(qrHash);
    const isSuspiciousVelocity = await this.checkSuspiciousVelocity(qrHash);

    // Store scan in history
    const { error: historyError } = await supabase
      .from('qr_scan_history')
      .insert({
        qr_code_hash: qrHash,
        scan_timestamp: timestamp,
        is_authentic: isAuthentic,
        is_duplicate: isDuplicate,
        is_suspicious_velocity: isSuspiciousVelocity,
        user_contact: userContact || null,
        alert_sent: !isAuthentic, // Send alert if not authentic
      });

    if (historyError) {
      console.error('Error storing scan history:', historyError);
    }

    // If not authentic (invalid phone) or suspicious activity, send fraud alert
    if (!isAuthentic || isDuplicate || isSuspiciousVelocity) {
      await this.sendFraudAlert({
        qrData,
        qrHash,
        isAuthentic,
        isDuplicate,
        isSuspiciousVelocity,
        userContact,
        timestamp,
      });
    }

    const result: VerificationResult = {
      qrData,
      isAuthentic,
      isDuplicate,
      isSuspiciousVelocity,
      timestamp,
    };

    // Add info about phone verification
    if (phoneVerified) {
      result.productInfo = {
        productName: 'Verified Product',
        manufacturer: 'Authenticated by Phone',
        batchNumber: userContact,
      };
    }

    return result;
  }

  // Send fraud alert via edge function
  static async sendFraudAlert(alertData: any): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('send-qr-fraud-alert', {
        body: alertData,
      });

      if (error) {
        console.error('Error sending fraud alert:', error);
      } else {
        console.log('Fraud alert sent successfully:', data);
      }
    } catch (error) {
      console.error('Error invoking fraud alert function:', error);
    }
  }

  // Get recent scans
  static async getRecentScans(limit: number = 50) {
    const { data, error } = await supabase
      .from('qr_scan_history')
      .select('*')
      .order('scan_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching scan history:', error);
      return [];
    }

    return data || [];
  }
}
