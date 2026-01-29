import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ClipboardList, 
  Plus, 
  Film,
  MapPin,
  Users,
  Clock,
  Sun,
  Cloud,
  Sunrise,
  Sunset,
  Download,
  Send,
  Loader2,
  Calendar,
  Phone,
  Mail,
  Utensils,
  AlertTriangle,
  Check,
  Eye,
  Printer,
  ChevronDown,
  Thermometer,
  Droplets,
  Wind
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CallSheets() {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedShootDayId, setSelectedShootDayId] = useState("");
  const [viewingCallSheet, setViewingCallSheet] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [productionInfo, setProductionInfo] = useState({
    production_company: "",
    producer: "",
    director: "",
    first_ad: "",
    production_phone: "",
    hospital_address: ""
  });

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

  const { data: callSheets = [], isLoading: callSheetsLoading } = useQuery({
    queryKey: ['callSheets', selectedProjectId],
    queryFn: () => base44.entities.CallSheet.filter({ project_id: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const { data: shootDays = [] } = useQuery({
    queryKey: ['shootDays', selectedProjectId],
    queryFn: () => base44.entities.ShootDay.filter({ project_id: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', selectedProjectId],
    queryFn: () => base44.entities.Location.filter({ project_id: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', selectedProjectId],
    queryFn: () => base44.entities.ProjectAssignment.filter({ project_id: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crewMembers'],
    queryFn: () => base44.entities.CrewMember.list()
  });

  const createCallSheetMutation = useMutation({
    mutationFn: (data) => base44.entities.CallSheet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callSheets'] });
      setGenerateDialogOpen(false);
      setSelectedShootDayId("");
      toast.success("Call sheet generated!");
    }
  });

  const generateCallSheet = async () => {
    if (!selectedShootDayId || !selectedProjectId) return;
    
    setIsGenerating(true);
    
    try {
      const shootDay = shootDays.find(d => d.id === selectedShootDayId);
      const location = locations.find(l => l.id === shootDay?.location_id);
      const scenes = selectedProject?.script_analysis_results?.scenes || [];
      const scheduledScenes = scenes.filter(s => shootDay?.scenes_scheduled?.includes(s.scene_number));
      
      // Get assigned crew for this day
      const dayAssignments = assignments.filter(a => 
        a.assigned_dates?.includes(shootDay?.shoot_date) || a.status === 'confirmed'
      );
      
      const crewForDay = dayAssignments.map(assignment => {
        const member = crewMembers.find(c => c.id === assignment.crew_member_id);
        return {
          ...member,
          department: assignment.department,
          role: assignment.role,
          call_time: assignment.call_time || shootDay?.general_call_time
        };
      }).filter(Boolean);

      // Group crew by department
      const crewByDepartment = crewForDay.reduce((acc, member) => {
        const dept = member.department || "Other";
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(member);
        return acc;
      }, {});

      // Generate weather data using AI
      const weatherPrompt = `Generate realistic weather forecast data for a film shoot on ${shootDay?.shoot_date} in ${location?.address || "Los Angeles"}. Include temperature, conditions, humidity, wind speed, and any filming considerations.`;
      
      const weatherData = await base44.integrations.Core.InvokeLLM({
        prompt: weatherPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            temperature_high: { type: "number" },
            temperature_low: { type: "number" },
            conditions: { type: "string" },
            humidity: { type: "number" },
            wind_speed: { type: "number" },
            sunrise: { type: "string" },
            sunset: { type: "string" },
            filming_notes: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Check for warnings
      const adminWarnings = [];
      
      // Check dietary needs
      const dietaryCrew = crewForDay.filter(c => c.dietary_restrictions?.length > 0);
      if (dietaryCrew.length > 0) {
        const dietaryNeeds = {};
        dietaryCrew.forEach(c => {
          c.dietary_restrictions?.forEach(diet => {
            dietaryNeeds[diet] = (dietaryNeeds[diet] || 0) + 1;
          });
        });
        Object.entries(dietaryNeeds).forEach(([diet, count]) => {
          adminWarnings.push(`🍽️ ${count} crew need ${diet} meals`);
        });
      }

      // Build schedule breakdown
      const scheduleBreakdown = scheduledScenes.map((scene, index) => ({
        time: index === 0 ? shootDay?.general_call_time : `+${scene.estimated_shooting_time || 2}h`,
        scene: scene.scene_number,
        description: scene.description,
        cast: scene.characters || []
      }));

      // Create call sheet
      const dayNumber = callSheets.filter(cs => cs.project_id === selectedProjectId).length + 1;
      
      await createCallSheetMutation.mutateAsync({
        project_id: selectedProjectId,
        shoot_day_id: selectedShootDayId,
        shoot_date: shootDay?.shoot_date,
        day_number: dayNumber,
        production_info: productionInfo,
        location_details: {
          name: location?.real_world_name,
          address: location?.address,
          contact: location?.contact_info,
          parking_notes: location?.practical_notes?.join(", "),
          permit_requirements: location?.permit_requirements
        },
        schedule_breakdown: scheduleBreakdown,
        crew_call_times: Object.entries(crewByDepartment).map(([dept, members]) => ({
          department: dept,
          call_time: shootDay?.general_call_time,
          members: members.map(m => ({
            name: m.full_name,
            role: m.role || m.primary_role,
            phone: m.phone,
            call_time: m.call_time
          }))
        })),
        weather_info: weatherData,
        sun_times: {
          sunrise: weatherData.sunrise,
          sunset: weatherData.sunset
        },
        catering_info: {
          breakfast: "6:30 AM",
          lunch: "12:30 PM",
          dietary_notes: Object.entries(
            crewForDay.reduce((acc, c) => {
              c.dietary_restrictions?.forEach(d => {
                acc[d] = (acc[d] || 0) + 1;
              });
              return acc;
            }, {})
          ).map(([diet, count]) => `${count}x ${diet}`).join(", ")
        },
        safety_notes: weatherData.filming_notes || [],
        admin_warnings: adminWarnings,
        distributed: false
      });

    } catch (error) {
      console.error("Failed to generate call sheet:", error);
      toast.error("Failed to generate call sheet");
    } finally {
      setIsGenerating(false);
    }
  };

  const getDietaryIcon = (diet) => {
    const icons = {
      'Vegetarian': '🥗',
      'Vegan': '🌱',
      'Gluten-Free': '🌾',
      'Halal': '☪️',
      'Kosher': '✡️',
      'Nut Allergy': '🥜',
      'Dairy-Free': '🥛'
    };
    return icons[diet] || '🍽️';
  };

  const existingCallSheetDates = callSheets.map(cs => cs.shoot_date);
  const availableShootDays = shootDays.filter(sd => !existingCallSheetDates.includes(sd.shoot_date));

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-amber-400" />
            Call Sheets
          </h1>
          <p className="text-slate-400 mt-1">Generate and manage daily call sheets</p>
        </div>
        <Button 
          onClick={() => setGenerateDialogOpen(true)}
          disabled={!selectedProjectId || availableShootDays.length === 0}
          className="shilpi-gradient text-white shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Call Sheet
        </Button>
      </div>

      {/* Project Selector */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Call Sheets Grid */}
      {selectedProjectId && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {callSheets.map((callSheet, index) => (
              <motion.div
                key={callSheet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-2">
                          Day {callSheet.day_number}
                        </Badge>
                        <CardTitle className="text-white">
                          {format(new Date(callSheet.shoot_date), "EEEE, MMMM d")}
                        </CardTitle>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={callSheet.distributed 
                          ? "border-emerald-500/30 text-emerald-400" 
                          : "border-slate-600 text-slate-400"
                        }
                      >
                        {callSheet.distributed ? "Sent" : "Draft"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {callSheet.location_details?.name && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span className="truncate">{callSheet.location_details.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{callSheet.crew_call_times?.[0]?.call_time || "TBD"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {callSheet.crew_call_times?.reduce((sum, dept) => sum + dept.members?.length, 0) || 0} crew
                        </span>
                      </div>
                    </div>

                    {callSheet.weather_info && (
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-4 h-4" />
                          <span>{callSheet.weather_info.temperature_high}°</span>
                        </div>
                        <span>{callSheet.weather_info.conditions}</span>
                      </div>
                    )}

                    {callSheet.admin_warnings?.length > 0 && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <p className="text-xs text-amber-400">
                          {callSheet.admin_warnings.length} warnings
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-700/50"
                        onClick={() => setViewingCallSheet(callSheet)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="border-slate-700/50">
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-900 border-slate-700">
                          <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-800">
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-800">
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-800">
                            <Send className="w-4 h-4 mr-2" />
                            Send to Crew
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {selectedProjectId && callSheets.length === 0 && !callSheetsLoading && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Call Sheets Yet</h3>
            <p className="text-slate-400 text-center mb-6">
              {availableShootDays.length > 0 
                ? "Generate your first call sheet to get started"
                : "Schedule some shoot days first, then generate call sheets"}
            </p>
            {availableShootDays.length > 0 && (
              <Button 
                onClick={() => setGenerateDialogOpen(true)}
                className="shilpi-gradient text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Call Sheet
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              Generate Call Sheet
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Shoot Day</Label>
              <Select value={selectedShootDayId} onValueChange={setSelectedShootDayId}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                  <SelectValue placeholder="Choose a shoot day..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {availableShootDays.map((day) => {
                    const location = locations.find(l => l.id === day.location_id);
                    return (
                      <SelectItem key={day.id} value={day.id}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-400" />
                          {format(new Date(day.shoot_date), "MMM d, yyyy")}
                          {location && <span className="text-slate-500">- {location.real_world_name}</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-slate-700/50" />

            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Production Info</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Production Company</Label>
                  <Input
                    placeholder="Company name"
                    value={productionInfo.production_company}
                    onChange={(e) => setProductionInfo({...productionInfo, production_company: e.target.value})}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Production Phone</Label>
                  <Input
                    placeholder="Main contact number"
                    value={productionInfo.production_phone}
                    onChange={(e) => setProductionInfo({...productionInfo, production_phone: e.target.value})}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Director</Label>
                  <Input
                    placeholder="Director name"
                    value={productionInfo.director}
                    onChange={(e) => setProductionInfo({...productionInfo, director: e.target.value})}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">1st AD</Label>
                  <Input
                    placeholder="1st AD name"
                    value={productionInfo.first_ad}
                    onChange={(e) => setProductionInfo({...productionInfo, first_ad: e.target.value})}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs">Nearest Hospital</Label>
                  <Input
                    placeholder="Hospital address"
                    value={productionInfo.hospital_address}
                    onChange={(e) => setProductionInfo({...productionInfo, hospital_address: e.target.value})}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
              className="border-slate-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={generateCallSheet}
              disabled={!selectedShootDayId || isGenerating}
              className="shilpi-gradient text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Call Sheet Dialog */}
      <Dialog open={!!viewingCallSheet} onOpenChange={() => setViewingCallSheet(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-400" />
                Call Sheet - Day {viewingCallSheet?.day_number}
              </span>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {viewingCallSheet && format(new Date(viewingCallSheet.shoot_date), "EEEE, MMMM d, yyyy")}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {viewingCallSheet && (
            <div className="space-y-6 py-4">
              {/* Admin Warnings */}
              {viewingCallSheet.admin_warnings?.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    AD Notes (Not shown to crew)
                  </h4>
                  <ul className="space-y-1">
                    {viewingCallSheet.admin_warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-amber-300">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Production Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {viewingCallSheet.production_info?.production_company && (
                  <div>
                    <p className="text-xs text-slate-500">Production</p>
                    <p className="text-sm text-white">{viewingCallSheet.production_info.production_company}</p>
                  </div>
                )}
                {viewingCallSheet.production_info?.director && (
                  <div>
                    <p className="text-xs text-slate-500">Director</p>
                    <p className="text-sm text-white">{viewingCallSheet.production_info.director}</p>
                  </div>
                )}
                {viewingCallSheet.production_info?.first_ad && (
                  <div>
                    <p className="text-xs text-slate-500">1st AD</p>
                    <p className="text-sm text-white">{viewingCallSheet.production_info.first_ad}</p>
                  </div>
                )}
                {viewingCallSheet.production_info?.production_phone && (
                  <div>
                    <p className="text-xs text-slate-500">Production Phone</p>
                    <p className="text-sm text-white">{viewingCallSheet.production_info.production_phone}</p>
                  </div>
                )}
              </div>

              <Separator className="bg-slate-700/50" />

              {/* Weather & Sun */}
              {viewingCallSheet.weather_info && (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-red-400" />
                      <span className="text-white font-medium">
                        {viewingCallSheet.weather_info.temperature_high}°F
                      </span>
                      <span className="text-slate-500">/ {viewingCallSheet.weather_info.temperature_low}°F</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">{viewingCallSheet.weather_info.conditions}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-blue-400" />
                      <span className="text-slate-300">{viewingCallSheet.weather_info.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="w-5 h-5 text-teal-400" />
                      <span className="text-slate-300">{viewingCallSheet.weather_info.wind_speed} mph</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sunrise className="w-5 h-5 text-orange-400" />
                      <span className="text-slate-300">{viewingCallSheet.sun_times?.sunrise}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sunset className="w-5 h-5 text-pink-400" />
                      <span className="text-slate-300">{viewingCallSheet.sun_times?.sunset}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {viewingCallSheet.location_details?.name && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    Location
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <p className="text-white font-medium">{viewingCallSheet.location_details.name}</p>
                    <p className="text-sm text-slate-400">{viewingCallSheet.location_details.address}</p>
                    {viewingCallSheet.location_details.parking_notes && (
                      <p className="text-xs text-slate-500 mt-2">
                        Parking: {viewingCallSheet.location_details.parking_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Schedule */}
              {viewingCallSheet.schedule_breakdown?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Schedule
                  </h4>
                  <div className="rounded-xl overflow-hidden border border-slate-700/30">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-400">Time</TableHead>
                          <TableHead className="text-slate-400">Scene</TableHead>
                          <TableHead className="text-slate-400">Description</TableHead>
                          <TableHead className="text-slate-400">Cast</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingCallSheet.schedule_breakdown.map((item, i) => (
                          <TableRow key={i} className="border-slate-700/30">
                            <TableCell className="text-white font-mono">{item.time}</TableCell>
                            <TableCell className="text-amber-400 font-mono">{item.scene}</TableCell>
                            <TableCell className="text-slate-300">{item.description}</TableCell>
                            <TableCell className="text-slate-400">{item.cast?.join(", ")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Crew */}
              {viewingCallSheet.crew_call_times?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Crew Call Times
                  </h4>
                  <div className="space-y-3">
                    {viewingCallSheet.crew_call_times.map((dept, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{dept.department}</span>
                          <Badge variant="outline" className="border-slate-600 text-slate-400">
                            Call: {dept.call_time}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {dept.members?.map((member, j) => (
                            <div key={j} className="text-sm">
                              <span className="text-white">{member.name}</span>
                              <span className="text-slate-500"> - {member.role}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catering */}
              {viewingCallSheet.catering_info && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-400" />
                    Catering
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <div className="flex gap-6">
                      <div>
                        <span className="text-slate-500 text-sm">Breakfast:</span>
                        <span className="text-white ml-2">{viewingCallSheet.catering_info.breakfast}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-sm">Lunch:</span>
                        <span className="text-white ml-2">{viewingCallSheet.catering_info.lunch}</span>
                      </div>
                    </div>
                    {viewingCallSheet.catering_info.dietary_notes && (
                      <p className="text-sm text-slate-400 mt-2">
                        Dietary: {viewingCallSheet.catering_info.dietary_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700/50"
              onClick={() => setViewingCallSheet(null)}
            >
              Close
            </Button>
            <Button className="shilpi-gradient text-white">
              <Send className="w-4 h-4 mr-2" />
              Send to Crew
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}