import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";
import { useToast } from "@/hooks/use-toast";

export const EmailNotificationDemo = () => {
  const { sendEmailNotification } = useEmailNotifications();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [formData, setFormData] = useState({
    notification_type: 'new_messages' as const,
    subject: 'Test Notification',
    title: 'Test Email Alert',
    message: 'This is a test email notification to verify the system is working.',
    action_url: '/dashboard',
    action_label: 'View Dashboard'
  });

  const notificationTypes = [
    { value: 'new_messages', label: 'New Messages' },
    { value: 'ad_responses', label: 'Ad Responses' },
    { value: 'price_changes', label: 'Price Changes' },
    { value: 'ad_expiring', label: 'Ad Expiring' },
    { value: 'featured_ad_updates', label: 'Featured Ad Updates' },
    { value: 'watchlist_match', label: 'Watchlist Match' },
    { value: 'similar_ads', label: 'Similar Ads' }
  ];

  const handleSendTest = async () => {
    try {
      setLoading(true);
      setResult(null);

      await sendEmailNotification(formData);
      
      setResult('success');
      toast({
        title: "Test Email Sent",
        description: "Check your email inbox for the test notification",
      });
    } catch (error) {
      console.error('Failed to send test email:', error);
      setResult('error');
      toast({
        title: "Failed to Send",
        description: "There was an error sending the test email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notification Test
        </CardTitle>
        <CardDescription>
          Send a test email notification to verify the system is working properly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Notification Type</Label>
            <Select
              value={formData.notification_type}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, notification_type: value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Notification Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter notification title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Enter notification message"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="action_url">Action URL (optional)</Label>
            <Input
              id="action_url"
              value={formData.action_url}
              onChange={(e) => setFormData(prev => ({ ...prev, action_url: e.target.value }))}
              placeholder="/dashboard"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_label">Action Label (optional)</Label>
            <Input
              id="action_label"
              value={formData.action_label}
              onChange={(e) => setFormData(prev => ({ ...prev, action_label: e.target.value }))}
              placeholder="View Dashboard"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {result === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Email sent successfully</span>
              </div>
            )}
            {result === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Failed to send email</span>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSendTest} 
            disabled={loading}
            className="min-w-32"
          >
            {loading ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg text-sm">
          <p className="font-medium mb-2">Note:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• The email will be sent to your registered email address</li>
            <li>• Check your notification preferences to ensure the type is enabled</li>
            <li>• Check your spam folder if you don't receive the email</li>
            <li>• The notification will also appear in your in-app notifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};