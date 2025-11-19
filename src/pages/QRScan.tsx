import { useState, useRef } from "react";
import { Camera, Upload, Shield, AlertTriangle, CheckCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import jsQR from "jsqr";
import { QRVerificationService } from "@/services/qrVerificationService";
import { useQuery } from "@tanstack/react-query";

interface ScanResult {
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

const QRScan = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [userContact, setUserContact] = useState("");
  const [phoneVerificationResult, setPhoneVerificationResult] = useState<{
    isVerified: boolean;
    message: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch recent scan history
  const { data: scanHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['qr-scan-history'],
    queryFn: () => QRVerificationService.getRecentScans(),
  });

  const startLiveScanning = async () => {
    if (!userContact || userContact.trim() === '') {
      toast.error('Please enter your phone number first');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        scanQRFromVideo();
      }
    } catch (error) {
      toast.error("Failed to access camera. Please check permissions.");
      console.error("Camera access error:", error);
    }
  };

  const stopLiveScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const scanQRFromVideo = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        verifyQRCode(code.data);
        stopLiveScanning();
        return;
      }
    }

    requestAnimationFrame(scanQRFromVideo);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userContact || userContact.trim() === '') {
      toast.error('Please enter your phone number first');
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          verifyQRCode(code.data);
        } else {
          toast.error("No QR code found in the image");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const checkPhoneNumber = async () => {
    if (!userContact || userContact.trim() === '') {
      toast.error('Please enter a phone number first');
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('verified_phone_numbers')
        .select('*')
        .eq('phone_number', userContact)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking phone:', error);
        toast.error('Failed to verify phone number');
        return;
      }

      if (data) {
        setPhoneVerificationResult({
          isVerified: true,
          message: `✅ Phone number is VERIFIED and REAL${data.user_name ? ` (${data.user_name})` : ''}`
        });
        toast.success('Phone number verified!');
      } else {
        setPhoneVerificationResult({
          isVerified: false,
          message: '⚠️ Phone number is NOT VERIFIED - This is a FAKE/UNREGISTERED number'
        });
        toast.error('Phone number not verified!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to check phone number');
    }
  };

  const verifyQRCode = async (qrData: string) => {
    try {
      toast.loading("Verifying QR code...");
      
      const result = await QRVerificationService.verifyQRCode(qrData, userContact);
      
      setScanResult(result);
      refetchHistory();

      if (result.isAuthentic) {
        toast.success("✅ Authentic Product Verified!");
      } else {
        toast.error("⚠️ Counterfeit Detected - Alert Sent!");
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
      console.error("Verification error:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">QR Code Security Scanner</h1>
          <p className="text-muted-foreground">Advanced fraud detection with instant verification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>
                Scan any QR code - Authenticity verified by your registered phone number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="live" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="live">
                    <Camera className="h-4 w-4 mr-2" />
                    Live Scan
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="live" className="space-y-4">
                  <div className="space-y-4">
                    <div className="bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                      {isScanning ? (
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <div className="text-center p-8">
                          <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">Click Start to begin scanning</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact">Phone Number (Required)</Label>
                      <Input
                        id="contact"
                        type="tel"
                        placeholder="e.g. +919876543210"
                        value={userContact}
                        onChange={(e) => {
                          setUserContact(e.target.value);
                          setPhoneVerificationResult(null);
                        }}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: +91XXXXXXXXXX (Test: +919876543210)
                      </p>
                    </div>

                    {phoneVerificationResult && (
                      <Alert variant={phoneVerificationResult.isVerified ? "default" : "destructive"}>
                        {phoneVerificationResult.isVerified ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <AlertDescription className="text-sm">
                          {phoneVerificationResult.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      onClick={checkPhoneNumber} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Check if Phone Number is Real or Fake
                    </Button>

                    <div className="flex gap-2">
                      {!isScanning ? (
                        <Button onClick={startLiveScanning} className="flex-1">
                          <Camera className="h-4 w-4 mr-2" />
                          Start Scanning
                        </Button>
                      ) : (
                        <Button onClick={stopLiveScanning} variant="destructive" className="flex-1">
                          Stop Scanning
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-upload">Phone Number (Required)</Label>
                      <Input
                        id="contact-upload"
                        type="tel"
                        placeholder="e.g. +919876543210"
                        value={userContact}
                        onChange={(e) => {
                          setUserContact(e.target.value);
                          setPhoneVerificationResult(null);
                        }}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: +91XXXXXXXXXX (Test: +919876543210)
                      </p>
                    </div>

                    {phoneVerificationResult && (
                      <Alert variant={phoneVerificationResult.isVerified ? "default" : "destructive"}>
                        {phoneVerificationResult.isVerified ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <AlertDescription className="text-sm">
                          {phoneVerificationResult.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      onClick={checkPhoneNumber} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Check if Phone Number is Real or Fake
                    </Button>

                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Upload an image containing a QR code
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Choose File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>

          {scanResult && (
            <Alert variant={scanResult.isAuthentic ? "default" : "destructive"}>
              {scanResult.isAuthentic ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <AlertTitle className="text-lg font-semibold">
                {scanResult.isAuthentic ? "✅ Authentic Product" : "⚠️ Counterfeit Detected"}
              </AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                {scanResult.isAuthentic ? (
                  <div>
                    <p className="font-medium">Product Details:</p>
                    <p>Name: {scanResult.productInfo?.productName}</p>
                    <p>Manufacturer: {scanResult.productInfo?.manufacturer}</p>
                    {scanResult.productInfo?.batchNumber && (
                      <p>Batch: {scanResult.productInfo.batchNumber}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold">Security Alert Triggered!</p>
                    {scanResult.isDuplicate && (
                      <Badge variant="destructive" className="mr-2">Duplicate Scan</Badge>
                    )}
                    {scanResult.isSuspiciousVelocity && (
                      <Badge variant="destructive">Suspicious Velocity</Badge>
                    )}
                    <p className="mt-2">
                      Incident report has been sent to security personnel and registered contacts.
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Scanned: {new Date(scanResult.timestamp).toLocaleString()}
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Scans
              </CardTitle>
              <CardDescription>Latest verification history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scanHistory && Array.isArray(scanHistory) && scanHistory.length > 0 ? (
                  scanHistory.slice(0, 10).map((scan: any) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {scan.is_authentic ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <div className="text-sm">
                          <p className="font-medium">
                            {scan.is_authentic ? "Authentic" : "Counterfeit"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(scan.scan_timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {scan.is_duplicate && (
                        <Badge variant="outline" className="text-xs">Duplicate</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No scans yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Phone Verification</p>
                  <p className="text-xs text-muted-foreground">Registered number validation</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Duplicate Detection</p>
                  <p className="text-xs text-muted-foreground">Real-time monitoring</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Velocity Checks</p>
                  <p className="text-xs text-muted-foreground">Location-based validation</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Instant Alerts</p>
                  <p className="text-xs text-muted-foreground">For unauthorized users</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-1">Test Phone Numbers:</p>
                <p className="text-xs text-muted-foreground">+919876543210</p>
                <p className="text-xs text-muted-foreground">+919876543211</p>
                <p className="text-xs text-muted-foreground">+911234567890</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRScan;
