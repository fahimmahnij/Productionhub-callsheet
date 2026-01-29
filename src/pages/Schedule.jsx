import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Film,
  MapPin,
  Users,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GripVertical,
  Trash2,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks } from "date-fns";

export default function Schedule() {
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("projectId");
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdParam || "");
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [createShootDayOpen, setCreateShootDayOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newShootDay, setNewShootDay] = useState({
    location_id: "",
    general_call_time: "07:00",
    estimated_wrap_time: "19:00",
    scenes_scheduled: [],
    crew_assigned: []
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

  const { data: shootDays = [], isLoading: shootDaysLoading } = useQuery({
    queryKey: ['shootDays', selectedProjectId],
    queryFn: () => base44.entities.ShootDay.filter({ project_id: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', selectedProjectId],
    queryFn: () => base44.entities.Location.filter({ project_id: selectedProjectId, status: 'confirmed' }),
    enabled: !!selectedProjectId
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', selectedProjectId],
    queryFn: () => base44.entities.ProjectAssignment.filter({ project_id: selectedProjectId }),
    enabled: !!selectedProjectId
  });

  const createShootDayMutation = useMutation({
    mutationFn: (data) => base44.entities.ShootDay.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shootDays'] });
      setCreateShootDayOpen(false);
      resetNewShootDay();
    }
  });

  const updateShootDayMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShootDay.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shootDays'] })
  });

  const deleteShootDayMutation = useMutation({
    mutationFn: (id) => base44.entities.ShootDay.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shootDays'] })
  });

  const resetNewShootDay = () => {
    setNewShootDay({
      location_id: "",
      general_call_time: "07:00",
      estimated_wrap_time: "19:00",
      scenes_scheduled: [],
      crew_assigned: []
    });
    setSelectedDate(null);
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  });

  const scenes = selectedProject?.script_analysis_results?.scenes || [];
  const unscheduledScenes = scenes.filter(scene => 
    !shootDays.some(day => day.scenes_scheduled?.includes(scene.scene_number))
  );

  const getShootDayForDate = (date) => {
    return shootDays.find(day => isSameDay(new Date(day.shoot_date), date));
  };

  const openCreateForDate = (date) => {
    setSelectedDate(date);
    setCreateShootDayOpen(true);
  };

  const handleCreateShootDay = () => {
    if (!selectedDate || !selectedProjectId) return;
    
    const location = locations.find(l => l.id === newShootDay.location_id);
    
    createShootDayMutation.mutate({
      project_id: selectedProjectId,
      shoot_date: format(selectedDate, 'yyyy-MM-dd'),
      location_id: newShootDay.location_id,
      location_name: location?.real_world_name || "",
      general_call_time: newShootDay.general_call_time,
      estimated_wrap_time: newShootDay.estimated_wrap_time,
      scenes_scheduled: newShootDay.scenes_scheduled,
      crew_assigned: newShootDay.crew_assigned,
      status: "planned"
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    // If dropping a scene onto a shoot day
    if (destination.droppableId.startsWith('day-')) {
      const dayId = destination.droppableId.replace('day-', '');
      const shootDay = shootDays.find(d => d.id === dayId);
      
      if (shootDay) {
        const currentScenes = shootDay.scenes_scheduled || [];
        if (!currentScenes.includes(draggableId)) {
          updateShootDayMutation.mutate({
            id: dayId,
            data: {
              scenes_scheduled: [...currentScenes, draggableId]
            }
          });
        }
      }
    }
  };

  const removeSceneFromDay = (dayId, sceneNumber) => {
    const shootDay = shootDays.find(d => d.id === dayId);
    if (shootDay) {
      updateShootDayMutation.mutate({
        id: dayId,
        data: {
          scenes_scheduled: (shootDay.scenes_scheduled || []).filter(s => s !== sceneNumber)
        }
      });
    }
  };

  const toggleSceneForNewDay = (sceneNumber) => {
    setNewShootDay(prev => ({
      ...prev,
      scenes_scheduled: prev.scenes_scheduled.includes(sceneNumber)
        ? prev.scenes_scheduled.filter(s => s !== sceneNumber)
        : [...prev.scenes_scheduled, sceneNumber]
    }));
  };

  const getTimeIcon = (time) => {
    const t = time?.toUpperCase() || "";
    if (t.includes("NIGHT")) return <Moon className="w-3 h-3 text-indigo-400" />;
    if (t.includes("DAWN") || t.includes("SUNRISE")) return <Sunrise className="w-3 h-3 text-orange-400" />;
    if (t.includes("DUSK") || t.includes("SUNSET")) return <Sunset className="w-3 h-3 text-pink-400" />;
    return <Sun className="w-3 h-3 text-amber-400" />;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-amber-400" />
            Production Schedule
          </h1>
          <p className="text-slate-400 mt-1">Plan your shoot days and assign scenes</p>
        </div>
      </div>

      {/* Project Selector & Week Navigation */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="border-slate-700/50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 text-white font-medium">
                {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="border-slate-700/50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentWeek(new Date())}
                className="border-slate-700/50 ml-2"
              >
                Today
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Unscheduled Scenes */}
            <Card className="bg-slate-900/50 border-slate-800/50 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center justify-between">
                  <span>Unscheduled Scenes</span>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    {unscheduledScenes.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <Droppable droppableId="unscheduled">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-40 p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? "bg-slate-800/50" : ""
                      }`}
                    >
                      {unscheduledScenes.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <Check className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                          <p className="text-sm">All scenes scheduled!</p>
                        </div>
                      ) : (
                        unscheduledScenes.map((scene, index) => (
                          <Draggable
                            key={scene.scene_number}
                            draggableId={scene.scene_number}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 rounded-lg border transition-all cursor-grab ${
                                  snapshot.isDragging
                                    ? "bg-amber-500/20 border-amber-500/50 shadow-lg"
                                    : "bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <GripVertical className="w-4 h-4 text-slate-500" />
                                  <Badge variant="outline" className={`${
                                    scene.int_ext === "INT" 
                                      ? "border-blue-500/30 text-blue-400" 
                                      : "border-emerald-500/30 text-emerald-400"
                                  }`}>
                                    {scene.int_ext}
                                  </Badge>
                                  <span className="text-white font-mono text-sm">{scene.scene_number}</span>
                                  {getTimeIcon(scene.time_of_day)}
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2">{scene.description}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{scene.estimated_shooting_time}h</span>
                                  <Users className="w-3 h-3 ml-2" />
                                  <span>{scene.characters?.length || 0}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>

            {/* Calendar */}
            <div className="lg:col-span-3 space-y-4">
              <div className="grid grid-cols-7 gap-4">
                {weekDays.map((day) => {
                  const shootDay = getShootDayForDate(day);
                  const dayScenes = shootDay?.scenes_scheduled || [];
                  const location = locations.find(l => l.id === shootDay?.location_id);
                  
                  return (
                    <div key={day.toISOString()} className="space-y-2">
                      <div className={`text-center p-2 rounded-lg ${
                        isToday(day) 
                          ? "bg-amber-500/20 border border-amber-500/30" 
                          : "bg-slate-800/30"
                      }`}>
                        <p className="text-xs text-slate-500">{format(day, "EEE")}</p>
                        <p className={`text-lg font-semibold ${
                          isToday(day) ? "text-amber-400" : "text-white"
                        }`}>
                          {format(day, "d")}
                        </p>
                      </div>

                      <Droppable droppableId={shootDay ? `day-${shootDay.id}` : `new-${day.toISOString()}`}>
                        {(provided, snapshot) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-48 transition-all ${
                              snapshot.isDraggingOver 
                                ? "bg-amber-500/10 border-amber-500/30" 
                                : shootDay 
                                  ? "bg-slate-900/50 border-slate-700/50" 
                                  : "bg-slate-900/30 border-slate-800/30 border-dashed"
                            }`}
                          >
                            <CardContent className="p-3">
                              {shootDay ? (
                                <div className="space-y-3">
                                  {location && (
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                      <MapPin className="w-3 h-3 text-amber-400" />
                                      <span className="truncate">{location.real_world_name}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>{shootDay.general_call_time} call</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-red-400 hover:text-red-300"
                                      onClick={() => deleteShootDayMutation.mutate(shootDay.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="space-y-1">
                                    {dayScenes.map((sceneNum) => {
                                      const scene = scenes.find(s => s.scene_number === sceneNum);
                                      return scene ? (
                                        <div key={sceneNum} className="p-2 rounded bg-slate-800/50 border border-slate-700/30 group">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs font-mono text-white">{sceneNum}</span>
                                              {getTimeIcon(scene.time_of_day)}
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                              onClick={() => removeSceneFromDay(shootDay.id, sceneNum)}
                                            >
                                              <X className="w-3 h-3 text-slate-400" />
                                            </Button>
                                          </div>
                                          <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                                            {scene.location}
                                          </p>
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => openCreateForDate(day)}
                                  className="w-full h-full min-h-32 flex flex-col items-center justify-center text-slate-500 hover:text-amber-400 transition-colors"
                                >
                                  <Plus className="w-6 h-6 mb-1" />
                                  <span className="text-xs">Add Shoot Day</span>
                                </button>
                              )}
                              {provided.placeholder}
                            </CardContent>
                          </Card>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Create Shoot Day Dialog */}
      <Dialog open={createShootDayOpen} onOpenChange={setCreateShootDayOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-400" />
              Create Shoot Day - {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Select 
                  value={newShootDay.location_id} 
                  onValueChange={(v) => setNewShootDay({...newShootDay, location_id: v})}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-400" />
                          {loc.real_world_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Call Time</Label>
                  <Input
                    type="time"
                    value={newShootDay.general_call_time}
                    onChange={(e) => setNewShootDay({...newShootDay, general_call_time: e.target.value})}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Est. Wrap</Label>
                  <Input
                    type="time"
                    value={newShootDay.estimated_wrap_time}
                    onChange={(e) => setNewShootDay({...newShootDay, estimated_wrap_time: e.target.value})}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Scenes</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 rounded-lg bg-slate-800/30">
                {scenes.map((scene) => {
                  const isSelected = newShootDay.scenes_scheduled.includes(scene.scene_number);
                  const isScheduled = shootDays.some(d => d.scenes_scheduled?.includes(scene.scene_number));
                  
                  return (
                    <button
                      key={scene.scene_number}
                      onClick={() => !isScheduled && toggleSceneForNewDay(scene.scene_number)}
                      disabled={isScheduled}
                      className={`p-2 rounded-lg text-left transition-all ${
                        isScheduled 
                          ? "bg-slate-800/20 opacity-50 cursor-not-allowed" 
                          : isSelected 
                            ? "bg-amber-500/20 border-amber-500/50 border" 
                            : "bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-mono text-white">{scene.scene_number}</span>
                        <Badge variant="outline" className={`text-xs ${
                          scene.int_ext === "INT" 
                            ? "border-blue-500/30 text-blue-400" 
                            : "border-emerald-500/30 text-emerald-400"
                        }`}>
                          {scene.int_ext}
                        </Badge>
                        {isSelected && <Check className="w-3 h-3 text-amber-400 ml-auto" />}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{scene.location}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateShootDayOpen(false);
                resetNewShootDay();
              }}
              className="border-slate-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateShootDay}
              disabled={createShootDayMutation.isPending}
              className="shilpi-gradient text-white"
            >
              {createShootDayMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Shoot Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {!selectedProjectId && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarIcon className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Select a Project</h3>
            <p className="text-slate-400 text-center">
              Choose a project to start building your production schedule
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}