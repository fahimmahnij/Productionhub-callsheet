import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MapPin, 
  Search, 
  Sparkles,
  Film,
  Star,
  Phone,
  Mail,
  ExternalLink,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  Clock,
  DollarSign,
  AlertCircle,
  ChevronDown,
  Filter,
  Building2,
  TreePine
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

export default function Locations() {
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("projectId");
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdParam || "");
  const [selectedScriptLocation, setSelectedScriptLocation] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  const { data: selectedProject } = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: () => base44.entities.Project.filter({ id: selectedProjectId }),
    enabled: !!selectedProjectId,
    select: (data) => data?.[0]
  });

  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', selectedProjectId],
    queryFn: () => base44.entities.Location.filter({ project_id: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Location.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] })
  });

  const createLocationMutation = useMutation({
    mutationFn: (data) => base44.entities.Location.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] })
  });

  const scriptLocations = selectedProject?.script_analysis_results?.locations_mentioned || [];

  const searchForLocations = async (scriptLocation) => {
    setIsSearching(true);
    setSearchProgress(10);
    setSelectedScriptLocation(scriptLocation);

    try {
      const locationConstraints = selectedProject?.location_constraints || {};
      const searchQuery = `${scriptLocation.name} ${scriptLocation.description || ""} ${locationConstraints.city || ""} ${locationConstraints.state || ""} ${locationConstraints.country || ""}`.trim();

      setSearchProgress(30);

      // Use LLM to find and match real locations
      const searchPrompt = `You are a film location scout. Find 5 real-world locations that would be perfect for filming this scene:

Script Location: "${scriptLocation.name}"
Description: "${scriptLocation.description || "Not specified"}"
Type: ${scriptLocation.int_ext}
Requirements: ${scriptLocation.requirements?.join(", ") || "None specified"}
Preferred Area: ${locationConstraints.city || ""} ${locationConstraints.state || ""} ${locationConstraints.country || ""}

For each location suggestion, provide:
1. Real business/location name
2. Approximate address (city, state)
3. Why it matches the script requirements
4. Estimated suitability score (0-100)
5. Practical notes for filming (parking, power, noise levels, permit difficulty)
6. Potential contact info or type of venue

Be specific with real types of venues that exist. Include a mix of well-known and lesser-known options.`;

      setSearchProgress(50);

      const results = await base44.integrations.Core.InvokeLLM({
        prompt: searchPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            locations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  address: { type: "string" },
                  match_reason: { type: "string" },
                  suitability_score: { type: "number" },
                  practical_notes: { type: "array", items: { type: "string" } },
                  contact_type: { type: "string" },
                  estimated_daily_rate: { type: "number" },
                  permit_requirements: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setSearchProgress(80);

      // Save found locations
      for (const loc of results.locations || []) {
        await base44.entities.Location.create({
          project_id: selectedProjectId,
          script_location_id: scriptLocation.id,
          script_location_name: scriptLocation.name,
          real_world_name: loc.name,
          address: loc.address,
          suitability_score: loc.suitability_score,
          practical_notes: loc.practical_notes,
          permit_requirements: loc.permit_requirements,
          daily_rate: loc.estimated_daily_rate,
          status: "suggested",
          google_maps_data: {
            match_reason: loc.match_reason,
            contact_type: loc.contact_type
          }
        });
      }

      setSearchProgress(100);
      queryClient.invalidateQueries({ queryKey: ['locations'] });

      setTimeout(() => {
        setIsSearching(false);
        setSelectedScriptLocation(null);
      }, 1000);

    } catch (error) {
      console.error("Location search failed:", error);
      setIsSearching(false);
    }
  };

  const updateStatus = (locationId, newStatus) => {
    updateLocationMutation.mutate({ id: locationId, data: { status: newStatus } });
  };

  const filteredLocations = locations.filter(loc => 
    statusFilter === "all" || loc.status === statusFilter
  );

  const statusColors = {
    suggested: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    shortlisted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30"
  };

  const groupedByScriptLocation = filteredLocations.reduce((acc, loc) => {
    const key = loc.script_location_name || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(loc);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <MapPin className="w-8 h-8 text-amber-400" />
            Location Scouting
          </h1>
          <p className="text-slate-400 mt-1">AI-powered location matching for your script</p>
        </div>
      </div>

      {/* Project Selector & Filters */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-full md:w-64 bg-slate-800/50 border-slate-700/50 text-white">
                <SelectValue placeholder="Select project..." />
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700/50 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="suggested">Suggested</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Search Progress */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <div className="flex-1">
                  <p className="text-amber-400 font-medium">
                    Searching for locations matching "{selectedScriptLocation?.name}"...
                  </p>
                  <Progress value={searchProgress} className="h-2 mt-2 bg-amber-500/20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Script Locations to Scout */}
      {selectedProjectId && scriptLocations.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Script Locations to Scout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {scriptLocations.map((loc) => {
                const existingLocations = locations.filter(l => l.script_location_id === loc.id);
                const hasConfirmed = existingLocations.some(l => l.status === "confirmed");
                
                return (
                  <div 
                    key={loc.id} 
                    className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${
                          loc.int_ext === "INT" 
                            ? "border-blue-500/30 text-blue-400" 
                            : "border-emerald-500/30 text-emerald-400"
                        }`}>
                          {loc.int_ext}
                        </Badge>
                        {hasConfirmed && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Confirmed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <h4 className="font-medium text-white mb-1">{loc.name}</h4>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{loc.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {existingLocations.length} options found
                      </span>
                      <Button
                        size="sm"
                        onClick={() => searchForLocations(loc)}
                        disabled={isSearching}
                        className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                      >
                        <Search className="w-4 h-4 mr-1" />
                        Find More
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Found Locations */}
      {selectedProjectId && (
        <div className="space-y-6">
          {Object.entries(groupedByScriptLocation).map(([scriptName, locs]) => (
            <Card key={scriptName} className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  {scriptName}
                  <Badge variant="outline" className="ml-2 border-slate-600 text-slate-400">
                    {locs.length} options
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locs.map((location, index) => (
                    <motion.div
                      key={location.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50 transition-all cursor-pointer"
                        onClick={() => setSelectedLocation(location)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <Badge className={`${statusColors[location.status || 'suggested']} border`}>
                              {location.status || 'suggested'}
                            </Badge>
                            {location.suitability_score && (
                              <div className="flex items-center gap-1 text-amber-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">{location.suitability_score}</span>
                              </div>
                            )}
                          </div>

                          <h4 className="font-semibold text-white mb-1">{location.real_world_name}</h4>
                          <p className="text-sm text-slate-500 mb-3">{location.address}</p>

                          {location.google_maps_data?.match_reason && (
                            <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                              {location.google_maps_data.match_reason}
                            </p>
                          )}

                          {location.daily_rate && (
                            <div className="flex items-center gap-1 text-sm text-slate-400 mb-3">
                              <DollarSign className="w-4 h-4" />
                              <span>~${location.daily_rate}/day</span>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 border-slate-700/50 text-slate-300"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Update Status
                                  <ChevronDown className="w-4 h-4 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-900 border-slate-700">
                                {['shortlisted', 'contacted', 'confirmed', 'rejected'].map((status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateStatus(location.id, status);
                                    }}
                                    className="text-slate-300 focus:text-white focus:bg-slate-800"
                                  >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

      {/* Empty State */}
      {selectedProjectId && filteredLocations.length === 0 && !isSearching && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MapPin className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Locations Found</h3>
            <p className="text-slate-400 text-center max-w-md">
              {scriptLocations.length > 0 
                ? "Click 'Find More' on any script location above to search for real-world matches."
                : "Upload and analyze a script first to get location suggestions."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Location Detail Dialog */}
      <Dialog open={!!selectedLocation} onOpenChange={() => setSelectedLocation(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              {selectedLocation?.real_world_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLocation && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <Badge className={`${statusColors[selectedLocation.status || 'suggested']} border`}>
                  {selectedLocation.status || 'suggested'}
                </Badge>
                {selectedLocation.suitability_score && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Suitability:</span>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="text-lg font-bold">{selectedLocation.suitability_score}/100</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-1">Address</h4>
                <p className="text-white">{selectedLocation.address}</p>
              </div>

              {selectedLocation.google_maps_data?.match_reason && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-1">Why This Location?</h4>
                  <p className="text-slate-300">{selectedLocation.google_maps_data.match_reason}</p>
                </div>
              )}

              {selectedLocation.practical_notes?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Practical Notes</h4>
                  <div className="space-y-2">
                    {selectedLocation.practical_notes.map((note, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLocation.permit_requirements?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Permit Requirements</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation.permit_requirements.map((permit, i) => (
                      <Badge key={i} variant="outline" className="border-amber-500/30 text-amber-400">
                        {permit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedLocation.daily_rate && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-1">Estimated Daily Rate</h4>
                  <p className="text-2xl font-bold text-white">${selectedLocation.daily_rate}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 shilpi-gradient text-white"
                  onClick={() => updateStatus(selectedLocation.id, 'confirmed')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Location
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-700/50"
                  onClick={() => updateStatus(selectedLocation.id, 'rejected')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}