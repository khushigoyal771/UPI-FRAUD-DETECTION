import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FraudAlertRequest {
  transactionId?: string;
  userId?: string;
  amount: number;
  timestamp: string;
  location?: string;
  transactionType: string;
  riskLevel: 'high' | 'medium' | 'low';
  fraudProbability: number;
  alertSettings: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    whatsappAlerts: boolean;
    emailAddress: string;
    phoneNumber: string;
    priority: 'high' | 'medium-high' | 'all';
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      transactionId,
      userId,
      amount,
      timestamp,
      location,
      transactionType,
      riskLevel,
      fraudProbability,
      alertSettings,
    }: FraudAlertRequest = await req.json();

    console.log("Received fraud alert request:", { 
      transactionId, 
      userId, 
      amount, 
      riskLevel, 
      fraudProbability 
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Check if alert should be sent based on priority settings
    const shouldSendAlert = (
      (alertSettings.priority === 'high' && riskLevel === 'high') ||
      (alertSettings.priority === 'medium-high' && ['high', 'medium'].includes(riskLevel)) ||
      (alertSettings.priority === 'all')
    );

    if (!shouldSendAlert) {
      console.log("Alert not sent due to priority settings");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Alert filtered by priority settings" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Store fraud alert in database
    const { data: alertData, error: insertError } = await supabase
      .from('fraud_alerts')
      .insert({
        transaction_id: transactionId,
        user_id: userId,
        amount,
        timestamp,
        location,
        transaction_type: transactionType,
        risk_level: riskLevel,
        fraud_probability: fraudProbability,
        alert_settings: alertSettings,
        alert_sent: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting fraud alert:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log("Fraud alert stored in database:", alertData.id);

    let emailSent = false;
    let smsStatus = "not_configured";
    let whatsappStatus = "not_configured";

    // Send email alert if enabled and email address provided
    if (alertSettings.emailAlerts && alertSettings.emailAddress) {
      try {
        const riskEmoji = riskLevel === 'high' ? '🚨' : riskLevel === 'medium' ? '⚠️' : '📋';
        const riskColor = riskLevel === 'high' ? '#dc2626' : riskLevel === 'medium' ? '#ea580c' : '#ca8a04';
        
        const emailResponse = await resend.emails.send({
          from: "UPI Fraud Detection <alerts@resend.dev>",
          to: [alertSettings.emailAddress],
          subject: `${riskEmoji} ${riskLevel.toUpperCase()} Risk Transaction Alert - ₹${amount.toLocaleString()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, ${riskColor}, #1e40af); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ Fraud Detection Alert</h1>
              </div>
              
              <div style="background: #f8fafc; padding: 20px; border-left: 4px solid ${riskColor};">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <span style="font-size: 24px; margin-right: 8px;">${riskEmoji}</span>
                    <span style="background: ${riskColor}; color: white; padding: 4px 12px; border-radius: 16px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
                      ${riskLevel} RISK
                    </span>
                  </div>
                  
                  <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Suspicious Transaction Detected</h2>
                  
                  <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
                    <div style="display: grid; gap: 12px;">
                      <div style="display: flex; justify-content: space-between;">
                        <strong>Amount:</strong>
                        <span style="color: ${riskColor}; font-weight: bold;">₹${amount.toLocaleString()}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <strong>Time:</strong>
                        <span>${new Date(timestamp).toLocaleString()}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <strong>Type:</strong>
                        <span>${transactionType}</span>
                      </div>
                      ${location ? `<div style="display: flex; justify-content: space-between;">
                        <strong>Location:</strong>
                        <span>${location}</span>
                      </div>` : ''}
                      <div style="display: flex; justify-content: space-between;">
                        <strong>Fraud Probability:</strong>
                        <span style="color: ${riskColor}; font-weight: bold;">${(fraudProbability * 100).toFixed(1)}%</span>
                      </div>
                      ${transactionId ? `<div style="display: flex; justify-content: space-between;">
                        <strong>Transaction ID:</strong>
                        <span style="font-family: monospace; font-size: 12px;">${transactionId}</span>
                      </div>` : ''}
                    </div>
                  </div>
                  
                  <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
                    <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">⚠️ Immediate Actions Required</h3>
                    <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.5;">
                      <li>Open your official banking app to verify this transaction</li>
                      <li>Contact your bank immediately if you didn't authorize this transaction</li>
                      <li>Do not click on suspicious links or share OTPs</li>
                      <li>Monitor your account for additional unauthorized activity</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; padding: 16px; background: #f8fafc; border-radius: 6px;">
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                      This alert was generated by the UPI Fraud Detection System at ${new Date().toLocaleString()}
                    </p>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">
                      If this is a false positive, you can adjust your alert settings in the dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          `,
        });

        console.log("Email sent successfully:", emailResponse);
        emailSent = true;

        // Update database with email sent status
        await supabase
          .from('fraud_alerts')
          .update({ email_sent: true })
          .eq('id', alertData.id);

      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        emailSent = false;
      }
    }

    // SMS and WhatsApp would be implemented here with respective APIs
    if (alertSettings.smsAlerts && alertSettings.phoneNumber) {
      smsStatus = "simulated_sent"; // Placeholder for SMS integration
    }

    if (alertSettings.whatsappAlerts && alertSettings.phoneNumber) {
      whatsappStatus = "simulated_sent"; // Placeholder for WhatsApp integration
    }

    const response = {
      success: true,
      alertId: alertData.id,
      emailSent,
      smsStatus,
      whatsappStatus,
      riskLevel,
      fraudProbability,
      message: "Fraud alert processed successfully",
    };

    console.log("Fraud alert processed:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-fraud-alert function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);