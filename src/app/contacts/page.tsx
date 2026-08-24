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
  Check,
  Copy,
  Building,
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
      department: department || "Engineering",
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

  const handleStartInstantCallWith = async (contact: Contact) => {
    if (!user) return;
    const meeting = await meetingService.createMeeting({
      title: `Meeting with ${contact.name}`,
      hostId: user.id,
      hostName: user.name,
      hostEmail: user.email,
    });
    router.push(`/meeting/${meeting.meetingId}`);
  };

  const handleGenerateInvite = async (contact: Contact) => {
    if (!user) return;
    const meeting = await meetingService.createMeeting({
      title: `1-on-1 Call with ${contact.name}`,
      hostId: user.id,
      hostName: user.name,
      hostEmail: user.email,
    });
    const url = `${window.location.origin}/meeting/${meeting.meetingId}`;
    setSelectedContact(contact);
    setGeneratedInviteUrl(url);
    setIsInviteModalOpen(true);
  };

  const handleCopyInvite = () => {
    if (generatedInviteUrl) {
      navigator.clipboard.writeText(generatedInviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredContacts = contacts.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.role && c.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout
      title="Team Directory"
      subtitle="Manage your team colleagues, departments, and launch instant 1-on-1 calls."
    >
      <div className="space-y-5">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Member</span>
          </Button>
        </div>

        {/* Contacts Table (Clean HR Style) */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No team members found.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={c.name}
                            src={c.avatar}
                            size="sm"
                            status={c.status === "online" ? "online" : "offline"}
                          />
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="primary" size="sm">
                          {c.department || "General"}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {c.role || "Team Member"}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleStartInstantCallWith(c)}
                            className="h-7 text-xs px-2.5"
                          >
                            <Video className="w-3 h-3 mr-1" />
                            <span>Call</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateInvite(c)}
                            className="h-7 text-xs px-2.5"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            <span>Invite</span>
                          </Button>

                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            title="Remove contact"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
      >
        <form onSubmit={handleAddContact} className="space-y-4 pt-2">
          <Input
            label="Full Name *"
            placeholder="e.g. Sarah Jenkins"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. sarah@firstoptionagency.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Role"
              placeholder="e.g. Product Designer"
              value={role}
              onChange={e => setRole(e.target.value)}
            />
            <Input
              label="Department"
              placeholder="e.g. Design"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={`Invite ${selectedContact?.name || "Member"}`}
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-600">
            Share this dedicated meeting link with <span className="font-semibold text-slate-900">{selectedContact?.name}</span> to start your video call:
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={generatedInviteUrl || ""}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 select-all"
            />
            <Button size="sm" variant="primary" onClick={handleCopyInvite}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
