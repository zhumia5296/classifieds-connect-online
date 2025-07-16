import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  FileText,
  User,
  Building,
  ExternalLink
} from "lucide-react";
import type { VerificationRequest } from '@/hooks/useVerification';

const VerificationAdmin = () => {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadVerificationRequests();
    }
  }, [isAdmin]);

  const loadVerificationRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          profiles:user_id (
            display_name,
            is_verified
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as VerificationRequest[]);
    } catch (error: any) {
      console.error('Error loading verification requests:', error);
      toast({
        title: "Error",
        description: "Failed to load verification requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('approve_verification', {
        request_id: requestId,
        reviewer_id: (await supabase.auth.getUser()).data.user?.id,
        admin_notes: adminNotes || null
      });

      if (error) throw error;

      toast({
        title: "Verification Approved",
        description: "User has been verified successfully.",
      });

      await loadVerificationRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error: any) {
      console.error('Error approving verification:', error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve verification.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('reject_verification', {
        request_id: requestId,
        reviewer_id: (await supabase.auth.getUser()).data.user?.id,
        rejection_reason: rejectionReason,
        admin_notes: adminNotes || null
      });

      if (error) throw error;

      toast({
        title: "Verification Rejected",
        description: "Verification request has been rejected.",
      });

      await loadVerificationRequests();
      setSelectedRequest(null);
      setAdminNotes('');
      setRejectionReason('');
    } catch (error: any) {
      console.error('Error rejecting verification:', error);
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject verification.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestTypeIcon = (type: string) => {
    return type === 'business' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Management
          </CardTitle>
          <CardDescription>
            Review and manage user verification requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="processed">
                Processed ({processedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending verification requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(request as any).profiles?.display_name || 'Anonymous User'}
                            {(request as any).profiles?.is_verified && (
                              <Shield className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRequestTypeIcon(request.request_type)}
                            <span className="capitalize">{request.request_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(request.submitted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setAdminNotes('');
                                  setRejectionReason('');
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Verification Request Review</DialogTitle>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-6">
                                  {/* User Information */}
                                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                                    <div>
                                      <Label className="text-sm font-medium">User</Label>
                                      <p className="text-sm">{(selectedRequest as any).profiles?.display_name || 'Anonymous User'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Request Type</Label>
                                      <div className="flex items-center gap-2">
                                        {getRequestTypeIcon(selectedRequest.request_type)}
                                        <span className="text-sm capitalize">{selectedRequest.request_type}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Submitted</Label>
                                      <p className="text-sm">{new Date(selectedRequest.submitted_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Status</Label>
                                      {getStatusBadge(selectedRequest.status)}
                                    </div>
                                  </div>

                                  {/* Business Information */}
                                  {selectedRequest.request_type === 'business' && (
                                    <div className="space-y-3 p-4 border rounded-lg">
                                      <h4 className="font-semibold">Business Information</h4>
                                      {selectedRequest.business_name && (
                                        <div>
                                          <Label className="text-sm font-medium">Business Name</Label>
                                          <p className="text-sm">{selectedRequest.business_name}</p>
                                        </div>
                                      )}
                                      {selectedRequest.business_registration && (
                                        <div>
                                          <Label className="text-sm font-medium">Registration Number</Label>
                                          <p className="text-sm">{selectedRequest.business_registration}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Documents */}
                                  <div className="space-y-3 p-4 border rounded-lg">
                                    <h4 className="font-semibold">Documents</h4>
                                    {selectedRequest.identity_document_url && (
                                      <div>
                                        <Label className="text-sm font-medium">Identity Document</Label>
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4" />
                                          <a 
                                            href={selectedRequest.identity_document_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                          >
                                            View Document <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                    {selectedRequest.business_document_url && (
                                      <div>
                                        <Label className="text-sm font-medium">Business Document</Label>
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4" />
                                          <a 
                                            href={selectedRequest.business_document_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                          >
                                            View Document <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Online Presence */}
                                  <div className="space-y-3 p-4 border rounded-lg">
                                    <h4 className="font-semibold">Online Presence</h4>
                                    {selectedRequest.website_url && (
                                      <div>
                                        <Label className="text-sm font-medium">Website</Label>
                                        <a 
                                          href={selectedRequest.website_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          {selectedRequest.website_url} <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                    )}
                                    {selectedRequest.social_media_urls && Object.keys(selectedRequest.social_media_urls).length > 0 && (
                                      <div>
                                        <Label className="text-sm font-medium">Social Media</Label>
                                        <div className="space-y-1">
                                          {Object.entries(selectedRequest.social_media_urls).map(([platform, url]) => 
                                            url && typeof url === 'string' ? (
                                              <a 
                                                key={platform}
                                                href={url as string} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline flex items-center gap-1 capitalize"
                                              >
                                                {platform}: {url as string} <ExternalLink className="h-3 w-3" />
                                              </a>
                                            ) : null
                                           )}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Additional Information */}
                                  {selectedRequest.additional_info && (
                                    <div className="space-y-3 p-4 border rounded-lg">
                                      <h4 className="font-semibold">Additional Information</h4>
                                      <p className="text-sm whitespace-pre-wrap">{selectedRequest.additional_info}</p>
                                    </div>
                                  )}

                                  {/* Admin Actions */}
                                  {selectedRequest.status === 'pending' && (
                                    <div className="space-y-4 p-4 border rounded-lg">
                                      <h4 className="font-semibold">Admin Actions</h4>
                                      
                                      <div className="space-y-2">
                                        <Label htmlFor="admin_notes">Admin Notes (Optional)</Label>
                                        <Textarea
                                          id="admin_notes"
                                          value={adminNotes}
                                          onChange={(e) => setAdminNotes(e.target.value)}
                                          placeholder="Internal notes about this verification..."
                                          rows={3}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="rejection_reason">Rejection Reason (Required for rejection)</Label>
                                        <Textarea
                                          id="rejection_reason"
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          placeholder="Reason for rejecting this verification request..."
                                          rows={3}
                                        />
                                      </div>

                                      <div className="flex gap-3">
                                        <Button
                                          onClick={() => handleApprove(selectedRequest.id)}
                                          disabled={actionLoading}
                                          className="flex-1"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Approve
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleReject(selectedRequest.id)}
                                          disabled={actionLoading || !rejectionReason.trim()}
                                          className="flex-1"
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="processed" className="mt-6">
              {processedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No processed verification requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Reviewed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(request as any).profiles?.display_name || 'Anonymous User'}
                            {(request as any).profiles?.is_verified && (
                              <Shield className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRequestTypeIcon(request.request_type)}
                            <span className="capitalize">{request.request_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(request.submitted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationAdmin;