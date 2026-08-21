"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, Avatar } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { contactService, meetingService } from "@/lib/services";
import { Contact } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  Video,
  Mail,
  MoreVertical,
  Trash2,
  Edit,
  Building,
  Check,
  Copy,
} from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");

  const { user } = useAuth();
  const router = useRouter();

  const loadContacts = async () => {
    const list = await contactService.getContacts();
    setContacts(list);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    await contactService.createContact({
      name,
      email,
      role: role || "Team Member",
      department: department || "General",
      status: "online",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    });

    setName("");
    setEmail("");
    setRole("");
    setDepartment("");
    setIsAddModalOpen(false);
    loadContacts();
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm("Are you sure you want to remove this contact?")) {
      await contactService.deleteContact(id);
      loadContacts();
    }
  };

  const handleInviteToMeeting = async (contact: Contact) => {
    if (!user) return;
    setSelectedContact(contact);
    const meeting = await meetingService.createMeeting({
      title: `Meeting with ${contact.name}`,
      hostId: user.id,
      hostName: user.name,
      hostEmail: user.email,
    });
    const url = `${window.location.origin}/meeting/${meeting.meetingId}`;
    setGeneratedInviteUrl(url);
    setIsInviteModalOpen(true);
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Company Contacts"
      subtitle="Connect with teammates and external clients with 1-click meeting invitations."
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search contacts by name, role, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </Button>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-700">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Contact</th>
                  <th className="py-3.5 px-4">Role / Title</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(contact => (
                  <tr key={contact.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={contact.avatar}
                          name={contact.name}
                          size="md"
                          status={contact.status}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{contact.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{contact.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{contact.role || "Member"}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="secondary" size="sm">
                        {contact.department || "General"}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          contact.status === "online"
                            ? "success"
                            : contact.status === "in-meeting"
                            ? "primary"
                            : contact.status === "busy"
                            ? "danger"
                            : "secondary"
                        }
                        size="sm"
                      >
                        {contact.status || "offline"}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInviteToMeeting(contact)}
                        >
                          <Video className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline">Meet</span>
                        </Button>

                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          title="Delete contact"
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Contact Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Contact"
          description="Save a colleague or client to your address book."
        >
          <form onSubmit={handleAddContact} className="space-y-4 pt-1">
            <Input
              label="Full Name"
              placeholder="e.g. Jessica Taylor"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. jessica@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <Input
              label="Role / Title"
              placeholder="e.g. Senior Frontend Engineer"
              value={role}
              onChange={e => setRole(e.target.value)}
            />

            <Input
              label="Department"
              placeholder="e.g. Product Engineering"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Add to Contacts
              </Button>
            </div>
          </form>
        </Modal>

        {/* Meeting Invite Link Modal */}
        {isInviteModalOpen && selectedContact && (
          <Modal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            title={`Invite ${selectedContact.name}`}
            description="A dedicated conference room has been generated."
          >
            <div className="space-y-4 pt-1">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-2">
                <p className="text-slate-700">
                  Send this link to <span className="font-semibold text-slate-900">{selectedContact.name}</span> ({selectedContact.email}) to join instantly:
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-blue-700 break-all select-all">
                  {generatedInviteUrl}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (generatedInviteUrl) {
                      navigator.clipboard.writeText(generatedInviteUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied" : "Copy Link"}</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (generatedInviteUrl) {
                      router.push(generatedInviteUrl);
                    }
                  }}
                >
                  <Video className="w-4 h-4" />
                  <span>Join Meeting Now</span>
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
