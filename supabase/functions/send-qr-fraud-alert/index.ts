import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QRFraudAlertRequest {
  qrData: string;
  qrHash: string;
  isAuthentic: boolean;
  isDuplicate: boolean;
  isSuspiciousVelocity: boolean;
  userContact?: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      qrData,
      qrHash,
      isAuthentic,
      isDuplicate,
      isSuspiciousVelocity,
      userContact,
      timestamp,
    }: QRFraudAlertRequest = await req.json();

    console.log("Received QR fraud alert:", { 
      qrHash, 
      isAuthentic, 
      isDuplicate, 
      isSuspiciousVelocity 
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get alert settings from the most recent fraud alert settings
    const { data: alertSettings } = await supabase
      .from('fraud_alerts')
      .select('alert_settings')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const settings = alertSettings?.alert_settings || {
      emailAlerts: true,
      emailAddress: "security@yourdomain.com", // Default fallback
    };

    let emailSent = false;
    let smsStatus = "not_configured";

    // Determine alert severity
    const severity = !isAuthentic ? "CRITICAL" : 
                    isSuspiciousVelocity ? "HIGH" : 
                    isDuplicate ? "MEDIUM" : "LOW";
    
    const severityColor = severity === "CRITICAL" ? "#dc2626" : 
                         severity === "HIGH" ? "#ea580c" : 
                         severity === "MEDIUM" ? "#f59e0b" : "#ca8a04";

    // Send email alert
    if (settings.emailAlerts && settings.emailAddress) {
      try {
        const flagsHtml = [
          !isAuthentic && '<span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 16px; font-size: 11px; margin: 2px;">COUNTERFEIT</span>',
          isDuplicate && '<span style="background: #ea580c; color: white; padding: 4px 12px; border-radius: 16px; font-size: 11px; margin: 2px;">DUPLICATE SCAN</span>',
          isSuspiciousVelocity && '<span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 16px; font-size: 11px; margin: 2px;">SUSPICIOUS VELOCITY</span>',
        ].filter(Boolean).join(' ');

        const emailResponse = await resend.emails.send({
          from: "QR Security Alert <alerts@resend.dev>",
          to: [settings.emailAddress],
          subject: `🚨 ${severity} SECURITY ALERT - Counterfeit QR Code Detected`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, ${severityColor}, #1e40af); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ QR Security Alert System</h1>
              </div>
              
              <div style="background: #f8fafc; padding: 20px; border-left: 4px solid ${severityColor};">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="margin-bottom: 16px;">
                    <span style="background: ${severityColor}; color: white; padding: 6px 16px; border-radius: 16px; font-weight: bold; font-size: 14px;">
                      ${severity} SEVERITY
                    </span>
                  </div>
                  
                  <h2 style="color: #1e293b; margin: 16px 0; font-size: 20px;">⚠️ Counterfeit Product Detected</h2>
                  
                  <div style="background: #fee2e2; border: 2px solid #dc2626; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
                    <h3 style="color: #991b1b; margin: 0 0 8px 0; font-size: 16px;">🚨 Security Flags</h3>
                    <div style="margin-top: 12px;">
                      ${flagsHtml}
                    </div>
                  </div>
                  
                  <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
                    <h3 style="color: #1e293b; margin: 0 0 12px 0; font-size: 16px;">Scan Details</h3>
                    <div style="display: grid; gap: 10px;">
                      <div style="display: flex; justify-content: space-between;">
                        <strong>QR Hash:</strong>
                        <span style="font-family: monospace; font-size: 11px; word-break: break-all; max-width: 60%;">${qrHash.substring(0, 32)}...</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <strong>Timestamp:</strong>
                        <span>${new Date(timestamp).toLocaleString()}</span>
                      </div>
                      ${userContact ? `<div style="display: flex; justify-content: space-between;">
                        <strong>Contact:</strong>
                        <span>${userContact}</span>
                      </div>` : ''}
                      <div style="display: flex; justify-content: space-between;">
                        <strong>Authentic:</strong>
                        <span style="color: ${isAuthentic ? '#16a34a' : '#dc2626'}; font-weight: bold;">${isAuthentic ? 'YES' : 'NO'}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <strong>Duplicate:</strong>
                        <span style="color: ${isDuplicate ? '#ea580c' : '#16a34a'}; font-weight: bold;">${isDuplicate ? 'YES' : 'NO'}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <strong>Suspicious Activity:</strong>
                        <span style="color: ${isSuspiciousVelocity ? '#f59e0b' : '#16a34a'}; font-weight: bold;">${isSuspiciousVelocity ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
                    <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">⚠️ Recommended Actions</h3>
                    <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.5;">
                      <li>Investigate the source of this QR code immediately</li>
                      <li>Contact law enforcement if criminal activity is suspected</li>
                      <li>Alert relevant stakeholders about potential counterfeit products</li>
                      <li>Review access logs and surveillance footage if available</li>
                      <li>Update security protocols if necessary</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; padding: 16px; background: #f8fafc; border-radius: 6px;">
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                      This alert was automatically generated by the QR Security System
                    </p>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">
                      Alert ID: ${qrHash.substring(0, 8)} | Generated: ${new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
                <p>UPI Guard Flow - Advanced QR Code Security System</p>
              </div>
            </div>
          `,
        });

        console.log("Email sent successfully:", emailResponse);
        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    // SMS would be implemented here
    if (userContact) {
      smsStatus = "simulated_sent"; // Placeholder for SMS integration
      console.log(`SMS alert would be sent to: ${userContact}`);
    }

    const response = {
      success: true,
      emailSent,
      smsStatus,
      severity,
      message: "QR fraud alert processed successfully",
    };

    console.log("QR fraud alert processed:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-qr-fraud-alert function:", error);
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
