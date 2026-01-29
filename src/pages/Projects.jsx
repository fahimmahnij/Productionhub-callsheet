import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Film, 
  Search, 
  MoreVertical,
  FileText,
  MapPin,
  Users,
  Calendar,
  Trash2,
  Edit,
  ArrowRight,
  Loader2,
  FolderOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    status: "draft",
    notes: "",
    location_constraints: { city: "", state: "", country: "" }
  });
  
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCreateDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProject(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      status: "draft",
      notes: "",
      location_constraints: { city: "", state: "", country: "" }
    });
  };

  const handleSubmit = () => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || "",
      status: project.status || "draft",
      notes: project.notes || "",
      location_constraints: project.location_constraints || { city: "", state: "", country: "" }
    });
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    draft: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    pre_production: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    production: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    post_production: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };

  const statusLabels = {
    draft: "Draft",
    pre_production: "Pre-Production",
    production: "Production",
    post_production: "Post-Production",
    completed: "Completed"
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Projects</h1>
          <p className="text-slate-400">Manage your film productions</p>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="shilpi-gradient text-white shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-900/50 border-slate-700/50 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pre_production">Pre-Production</SelectItem>
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="post_production">Post-Production</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No projects found</h3>
            <p className="text-slate-400 text-center mb-6">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Create your first project to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="shilpi-gradient text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                          <Film className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white group-hover:text-amber-400 transition-colors">
                            {project.name}
                          </CardTitle>
                          <p className="text-xs text-slate-500">
                            Created {format(new Date(project.created_date), "MMM d, yyyy")}
                          </p>
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
                            onClick={() => openEditDialog(project)}
                            className="text-slate-300 focus:text-white focus:bg-slate-800"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(project.id)}
                            className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Badge className={`${statusColors[project.status || 'draft']} border`}>
                      {statusLabels[project.status || 'draft']}
                    </Badge>

                    {project.script_analysis_results?.summary && (
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <div className="text-center p-2 rounded-lg bg-slate-800/30">
                          <FileText className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                          <p className="text-lg font-semibold text-white">
                            {project.script_analysis_results.summary.total_scenes || 0}
                          </p>
                          <p className="text-xs text-slate-500">Scenes</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-800/30">
                          <MapPin className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                          <p className="text-lg font-semibold text-white">
                            {project.script_analysis_results.summary.location_count || 0}
                          </p>
                          <p className="text-xs text-slate-500">Locations</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-800/30">
                          <Users className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                          <p className="text-lg font-semibold text-white">
                            {project.script_analysis_results.summary.character_count || 0}
                          </p>
                          <p className="text-xs text-slate-500">Characters</p>
                        </div>
                      </div>
                    )}

                    <Link to={createPageUrl(`ScriptAnalysis?projectId=${project.id}`)}>
                      <Button 
                        variant="outline" 
                        className="w-full border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300 hover:text-white group"
                      >
                        {project.script_analysis_results ? "View Analysis" : "Analyze Script"}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || !!editingProject} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditingProject(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                placeholder="My Awesome Film"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800/50 border-slate-700/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pre_production">Pre-Production</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="post_production">Post-Production</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location Constraints</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="City"
                  value={formData.location_constraints?.city || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location_constraints: { ...formData.location_constraints, city: e.target.value }
                  })}
                  className="bg-slate-800/50 border-slate-700/50"
                />
                <Input
                  placeholder="State"
                  value={formData.location_constraints?.state || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location_constraints: { ...formData.location_constraints, state: e.target.value }
                  })}
                  className="bg-slate-800/50 border-slate-700/50"
                />
                <Input
                  placeholder="Country"
                  value={formData.location_constraints?.country || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location_constraints: { ...formData.location_constraints, country: e.target.value }
                  })}
                  className="bg-slate-800/50 border-slate-700/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any additional notes about this project..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-slate-800/50 border-slate-700/50 min-h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditingProject(null);
                resetForm();
              }}
              className="border-slate-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
              className="shilpi-gradient text-white"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingProject ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}