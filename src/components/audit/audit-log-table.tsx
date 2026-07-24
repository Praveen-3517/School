"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AuditLog, User } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, FileJson } from "lucide-react";

type AuditLogWithActor = AuditLog & {
  actor: Pick<User, "name" | "email"> | null;
};

interface AuditLogTableProps {
  logs: AuditLogWithActor[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogWithActor | null>(null);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE": return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">CREATE</Badge>;
      case "UPDATE": return <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20">UPDATE</Badge>;
      case "DELETE": return <Badge variant="destructive" className="bg-red-500/10 hover:bg-red-500/20">DELETE</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getActorDisplay = (log: AuditLogWithActor) => {
    if (log.actor) {
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{log.actor.name}</span>
          <span className="text-xs text-muted-foreground">{log.actor.email}</span>
        </div>
      );
    }
    return <span className="text-muted-foreground italic">System / Unknown</span>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No audit logs found.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{format(new Date(log.createdAt), "MMM d, yyyy")}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "h:mm:ss a")}</span>
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{log.entityType}</span>
                    {log.entityId && <span className="text-xs text-muted-foreground font-mono">ID: {log.entityId.slice(-6)}</span>}
                  </div>
                </TableCell>
                <TableCell>{getActorDisplay(log)}</TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger render={<Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)} />}>
                      <Eye className="h-4 w-4 mr-2" /> View
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <FileJson className="h-5 w-5" />
                          Audit Log Details
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold text-muted-foreground block mb-1">Actor</span>
                            {log.actor ? `${log.actor.name} (${log.actor.email})` : 'System'}
                          </div>
                          <div>
                            <span className="font-semibold text-muted-foreground block mb-1">Timestamp</span>
                            {format(new Date(log.createdAt), "PPpp")}
                          </div>
                          <div>
                            <span className="font-semibold text-muted-foreground block mb-1">Action & Entity</span>
                            {log.action} - {log.entityType} {log.entityId && `(${log.entityId})`}
                          </div>
                          <div>
                            <span className="font-semibold text-muted-foreground block mb-1">Network Info</span>
                            {log.ipAddress || 'Unknown IP'} 
                          </div>
                        </div>

                        {log.previousData && (
                          <div className="mt-4">
                            <span className="font-semibold text-muted-foreground block mb-2">Previous Data</span>
                            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                              {JSON.stringify(JSON.parse(log.previousData), null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.newData && (
                          <div className="mt-4">
                            <span className="font-semibold text-muted-foreground block mb-2">New Data</span>
                            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                              {JSON.stringify(JSON.parse(log.newData), null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.metadata && (
                          <div className="mt-4">
                            <span className="font-semibold text-muted-foreground block mb-2">Metadata</span>
                            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                              {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
