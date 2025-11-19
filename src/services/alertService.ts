import { supabase } from "@/integrations/supabase/client";

interface AlertSettings {
  emailAlerts: boolean;
  smsAlerts: boolean;
  whatsappAlerts: boolean;
  emailAddress: string;
  phoneNumber: string;
  priority: 'high' | 'medium-high' | 'all';
}

interface FraudTransaction {
  transactionId?: string;
  userId?: string;
  amount: number;
  timestamp: string;
  location?: string;
  transactionType: string;
  fraudProbability: number;
}

export class AlertService {
  // Get alert settings from localStorage
  static getAlertSettings(): AlertSettings {
    const stored = localStorage.getItem('alertSettings');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default settings
    return {
      emailAlerts: true,
      smsAlerts: false,
      whatsappAlerts: false,
      emailAddress: '',
      phoneNumber: '',
      priority: 'high'
    };
  }

  // Determine risk level based on probability and patterns
  static determineRiskLevel(fraudProbability: number, amount: number, timestamp: string): 'high' | 'medium' | 'low' {
    const hour = new Date(timestamp).getHours();
    const isHighAmount = amount > 50000;
    const isOddTiming = hour < 6 || hour > 23;
    const isHighProbability = fraudProbability > 0.7;
    const isMediumProbability = fraudProbability > 0.4;

    // High risk conditions
    if (isHighProbability || (isMediumProbability && (isHighAmount || isOddTiming))) {
      return 'high';
    }
    
    // Medium risk conditions
    if (isMediumProbability || (fraudProbability > 0.2 && isHighAmount)) {
      return 'medium';
    }
    
    return 'low';
  }

  // Send fraud alert
  static async sendFraudAlert(transaction: FraudTransaction): Promise<{
    success: boolean;
    alertId?: string;
    error?: string;
  }> {
    try {
      const alertSettings = this.getAlertSettings();
      const riskLevel = this.determineRiskLevel(
        transaction.fraudProbability, 
        transaction.amount, 
        transaction.timestamp
      );

      console.log('Sending fraud alert:', { transaction, riskLevel, alertSettings });

      // Call the edge function to send alerts
      const { data, error } = await supabase.functions.invoke('send-fraud-alert', {
        body: {
          ...transaction,
          riskLevel,
          alertSettings,
        },
      });

      if (error) {
        console.error('Error calling send-fraud-alert:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('Fraud alert sent successfully:', data);

      return {
        success: true,
        alertId: data?.alertId,
      };
    } catch (error) {
      console.error('Error in sendFraudAlert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get recent fraud alerts from database
  static async getRecentAlerts(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentAlerts:', error);
      return [];
    }
  }
}