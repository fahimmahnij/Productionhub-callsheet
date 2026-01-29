import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone,
  Copy,
  Check,
  UserPlus,
  Film,
  Loader2,
  MoreVertical,
  Trash2,
  Edit,
  AlertCircle,
  Link2,
  ExternalLink,
  Utensils,
  Shield,
  Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const DEPARTMENTS = [
  "Production", "Direction", "Camera", "Lighting", "Sound", "Art", 
  "Wardrobe", "Makeup", "Grip", "Electric", "Locations", "Transportation",
  "Catering", "Post-Production", "VFX", "Stunts", "Other"
];

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Nut Allergy", "Dairy-Free"
];

export default function Crew() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    department: "",
    role: ""
  });

  const queryClient = useQueryClient();

  const { data: crewMembers = [], isLoading } = useQuery({
    queryKey: ['crewMembers'],
    queryFn: () => base44.entities.CrewMember.list('-created_date')
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.ProjectAssignment.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CrewMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crewMembers'] });
      toast.success("Crew member removed");
    }
  });

  const createInviteMutation = useMutation({
    mutationFn: async (data) => {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const project = projects.find(p => p.id === data.project_id);
      await base44.entities.CrewInvite.create({
        project_id: data.project_id,
        project_name: project?.name || "",
        token,
        department: data.department,
        role: data.role,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      return token;
    },
    onSuccess: (token) => {
      const link = `${window.location.origin}/CrewJoin?token=${token}`;
      setGeneratedLink(link);
    }
  });

  const generateInviteLink = () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }
    createInviteMutation.mutate({
      project_id: selectedProjectId,
      department: inviteForm.department,
      role: inviteForm.role
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredCrew = crewMembers.filter(member => {
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || member.departments?.includes(departmentFilter);
    return matchesSearch && matchesDepartment;
  });

  const crewByDepartment = filteredCrew.reduce((acc, member) => {
    const dept = member.departments?.[0] || "Other";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(member);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-400" />
            Crew Database
          </h1>
          <p className="text-slate-400 mt-1">Manage your production crew members</p>
        </div>
        <Button 
          onClick={() => setInviteDialogOpen(true)}
          className="shilpi-gradient text-white shadow-lg shadow-amber-500/20"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Crew
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{crewMembers.length}</p>
                <p className="text-xs text-slate-500">Total Crew</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Object.keys(crewByDepartment).length}</p>
                <p className="text-xs text-slate-500">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Film className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{assignments.filter(a => a.status === 'confirmed').length}</p>
                <p className="text-xs text-slate-500">Active Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {crewMembers.filter(m => m.dietary_restrictions?.length).length}
                </p>
                <p className="text-xs text-slate-500">Dietary Needs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search crew by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-900/50 border-slate-700/50 text-white">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Crew List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : filteredCrew.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Crew Members Yet</h3>
            <p className="text-slate-400 text-center mb-6">
              Start building your crew by generating invite links
            </p>
            <Button 
              onClick={() => setInviteDialogOpen(true)}
              className="shilpi-gradient text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Crew
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(crewByDepartment).map(([department, members]) => (
            <Card key={department} className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    {department}
                  </span>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    {members.length} members
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                                {member.full_name?.[0] || "?"}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{member.full_name}</h4>
                                <p className="text-sm text-slate-500">{member.primary_role}</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                                <DropdownMenuItem
                                  onClick={() => deleteMutation.mutate(member.id)}
                                  className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{member.email}</span>
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-2 text-slate-400">
                                <Phone className="w-4 h-4" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                          </div>

                          {member.dietary_restrictions?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {member.dietary_restrictions.map((diet) => (
                                <Badge key={diet} variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                                  <Utensils className="w-3 h-3 mr-1" />
                                  {diet}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {member.emergency_contact && (
                            <div className="mt-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
                              <p className="text-xs text-slate-500 mb-1">Emergency Contact</p>
                              <p className="text-sm text-slate-300">
                                {member.emergency_contact.name} ({member.emergency_contact.relationship})
                              </p>
                              <p className="text-xs text-slate-500">{member.emergency_contact.phone}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              Invite Crew Members
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-amber-400" />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department (Optional)</Label>
                <Select value={inviteForm.department} onValueChange={(v) => setInviteForm({...inviteForm, department: v})}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role (Optional)</Label>
                <Input
                  placeholder="e.g., Gaffer"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                  className="bg-slate-800/50 border-slate-700/50"
                />
              </div>
            </div>

            {!generatedLink && (
              <Button
                onClick={generateInviteLink}
                disabled={!selectedProjectId || createInviteMutation.isPending}
                className="w-full shilpi-gradient text-white"
              >
                {createInviteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Generate Invite Link
              </Button>
            )}

            {generatedLink && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-sm text-emerald-400 mb-2 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Invite link generated!
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="bg-slate-800/50 border-slate-700/50 text-sm"
                    />
                    <Button
                      onClick={copyLink}
                      variant="outline"
                      className="border-slate-700/50"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Share this link with crew members. It expires in 7 days.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedLink("");
                    setInviteForm({ department: "", role: "" });
                  }}
                  className="w-full border-slate-700/50"
                >
                  Generate Another Link
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}