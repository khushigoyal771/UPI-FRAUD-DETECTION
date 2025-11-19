import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([{
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        }]);

      if (error) {
        console.error('Error saving contact submission:', error);
        toast({
          title: "Error!",
          description: "There was an error sending your message. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error!",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="space-y-8">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold bg-gradient-text bg-clip-text text-transparent mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about our fraud detection system? We're here to help you secure your transactions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="space-y-8">
            <Card className="surface-elevated border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Get in Touch</CardTitle>
                <CardDescription>
                  Send us a message and we'll respond as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        name="name"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <Input
                        name="email"
                        type="email"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  <Input
                    name="subject"
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="bg-background/50"
                  />
                  <Textarea
                    name="message"
                    placeholder="Your message..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="bg-background/50"
                  />
                  <Button type="submit" className="w-full btn-hero" disabled={isSubmitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="surface-elevated border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Contact Information</CardTitle>
                <CardDescription>
                  Reach out to us through any of these channels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-secondary p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-muted-foreground">support@upifrauddetection.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-secondary p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <p className="text-muted-foreground">+91 9876543210</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-secondary p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Address</h3>
                    <p className="text-muted-foreground">
                      123 Tech Park, Cyber City<br />
                      Bangalore, Karnataka 560001
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated border-0 bg-gradient-accent">
              <CardHeader>
                <CardTitle className="text-xl">24/7 Support</CardTitle>
                <CardDescription>
                  Our fraud detection system is monitored around the clock to ensure your security.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">&lt;5min</div>
                    <div className="text-sm text-muted-foreground">Response Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading bg-gradient-text bg-clip-text text-transparent mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about our fraud detection system
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="surface-elevated border-0">
              <CardHeader>
                <CardTitle className="text-lg">How do I get started with fraud detection?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Simply upload your CSV dataset or use our sample data, train the model, and start making predictions. The entire process takes just a few minutes and works directly in your browser.
                </p>
              </CardContent>
            </Card>

            <Card className="surface-elevated border-0">
              <CardHeader>
                <CardTitle className="text-lg">What data format do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept CSV files with columns like TransactionID, UserID, Amount, Timestamp, Location, DeviceID, TransactionType, and FraudLabel. Our system adapts to missing columns automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="surface-elevated border-0">
              <CardHeader>
                <CardTitle className="text-lg">Is my data secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely! All processing happens locally in your browser using TensorFlow.js. No data leaves your device, ensuring complete privacy and security of your transaction information.
                </p>
              </CardContent>
            </Card>

            <Card className="surface-elevated border-0">
              <CardHeader>
                <CardTitle className="text-lg">How accurate is the fraud detection?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our models typically achieve 85-95% accuracy depending on dataset quality. We provide detailed metrics including Precision, Recall, and F1-scores to help you evaluate performance.
                </p>
              </CardContent>
            </Card>

            <Card className="surface-elevated border-0">
              <CardHeader>
                <CardTitle className="text-lg">Can I use this on mobile devices?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Our dashboard is fully responsive and works on smartphones and tablets. You can upload data, train models, and view analytics from any device.
                </p>
              </CardContent>
            </Card>

            <Card className="surface-elevated border-0">
              <CardHeader>
                <CardTitle className="text-lg">Do you offer API integration?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, we provide REST APIs for real-time transaction screening and integration with existing payment systems. Contact us for API documentation and enterprise support.
                </p>
              </CardContent>
            </Card>

            <Card className="surface-elevated border-0">
              <CardHeader>
                <CardTitle className="text-lg">How long does model training take?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Training time varies by dataset size: Small datasets (1K-10K transactions) take 30-60 seconds, medium datasets (10K-100K) take 2-5 minutes, and large datasets may take 5-15 minutes.
                </p>
              </CardContent>
            </Card>

            <Card className="surface-elevated border-0">
              <CardHeader>
                <CardTitle className="text-lg">Can I export my results?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can export trained models, prediction results, and analytics reports. The system provides various download options for integration with your existing workflows.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;