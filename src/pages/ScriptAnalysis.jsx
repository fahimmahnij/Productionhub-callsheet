import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Upload, 
  FileText, 
  Sparkles,
  Film,
  MapPin,
  Users,
  Clock,
  DollarSign,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Hash,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Package,
  Camera,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

export default function ScriptAnalysis() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  const { data: selectedProject, isLoading: projectLoading } = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: () => base44.entities.Project.filter({ id: selectedProjectId }),
    enabled: !!selectedProjectId,
    select: (data) => data?.[0]
  });

  useEffect(() => {
    if (projectId) setSelectedProjectId(projectId);
  }, [projectId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
  };

  const analyzeScript = async () => {
    if (!uploadedFile || !selectedProjectId) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setProgressMessage("Uploading script...");

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadedFile });
      setAnalysisProgress(25);
      setProgressMessage("Extracting text from script...");

      // Analyze with LLM
      setAnalysisProgress(40);
      setProgressMessage("AI is analyzing scenes, characters, and locations...");

      const analysisPrompt = `You are a professional script analyst. Analyze the following screenplay and extract detailed information.

For each scene, identify:
- Scene number
- INT/EXT designation
- Location description
- Time of day (DAY, NIGHT, DAWN, DUSK, etc.)
- Characters present
- Props mentioned
- Special notes (stunts, VFX, special equipment needed)
- Estimated shooting time in hours
- Complexity score (1-5)
- Page count estimation

Also provide:
- Full character list with scene counts and whether they're leads
- All props categorized (hand props, set dressing, special items, vehicles)
- Unique locations with requirements
- Equipment needs
- Genre and tone analysis
- Budget estimate range

Be thorough and professional in your analysis.`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            scenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scene_number: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  int_ext: { type: "string" },
                  time_of_day: { type: "string" },
                  characters: { type: "array", items: { type: "string" } },
                  props: { type: "array", items: { type: "string" } },
                  special_notes: { type: "string" },
                  estimated_shooting_time: { type: "number" },
                  complexity_score: { type: "number" },
                  page_count: { type: "number" }
                }
              }
            },
            characters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  scene_count: { type: "number" },
                  is_lead: { type: "boolean" },
                  description: { type: "string" }
                }
              }
            },
            props: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  scenes: { type: "array", items: { type: "string" } }
                }
              }
            },
            locations_mentioned: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  int_ext: { type: "string" },
                  description: { type: "string" },
                  requirements: { type: "array", items: { type: "string" } },
                  scene_count: { type: "number" }
                }
              }
            },
            equipment_needs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  scenes: { type: "array", items: { type: "string" } }
                }
              }
            },
            summary: {
              type: "object",
              properties: {
                total_scenes: { type: "number" },
                location_count: { type: "number" },
                character_count: { type: "number" },
                estimated_shoot_days: { type: "number" },
                budget_range: {
                  type: "object",
                  properties: {
                    low: { type: "number" },
                    high: { type: "number" }
                  }
                },
                genre: { type: "string" },
                primary_tone: { type: "string" },
                total_pages: { type: "number" }
              }
            }
          }
        }
      });

      setAnalysisProgress(80);
      setProgressMessage("Saving analysis results...");

      // Update project with analysis
      await base44.entities.Project.update(selectedProjectId, {
        script_file_url: file_url,
        script_analysis_results: analysis,
        budget_estimates: analysis.summary?.budget_range
      });

      // Create ScriptAnalysis record
      await base44.entities.ScriptAnalysis.create({
        project_id: selectedProjectId,
        ...analysis,
        analysis_date: new Date().toISOString()
      });

      setAnalysisProgress(100);
      setProgressMessage("Analysis complete!");

      queryClient.invalidateQueries({ queryKey: ['project', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      setTimeout(() => {
        setIsAnalyzing(false);
        setUploadedFile(null);
      }, 1500);

    } catch (error) {
      console.error("Analysis failed:", error);
      setIsAnalyzing(false);
      setProgressMessage("Analysis failed. Please try again.");
    }
  };

  const analysis = selectedProject?.script_analysis_results;

  const getTimeIcon = (time) => {
    const t = time?.toUpperCase() || "";
    if (t.includes("NIGHT")) return <Moon className="w-4 h-4 text-indigo-400" />;
    if (t.includes("DAWN") || t.includes("SUNRISE")) return <Sunrise className="w-4 h-4 text-orange-400" />;
    if (t.includes("DUSK") || t.includes("SUNSET")) return <Sunset className="w-4 h-4 text-pink-400" />;
    return <Sun className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" />
            AI Script Analysis
          </h1>
          <p className="text-slate-400 mt-1">Upload a screenplay for instant AI-powered breakdown</p>
        </div>
      </div>

      {/* Project Selector & Upload */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Select Project</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Upload Script</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.txt,.fdx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={!selectedProjectId || isAnalyzing}
                />
                <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all ${
                  uploadedFile 
                    ? "border-emerald-500/50 bg-emerald-500/10" 
                    : "border-slate-700/50 bg-slate-800/30 hover:border-amber-500/50 hover:bg-amber-500/5"
                }`}>
                  {uploadedFile ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">{uploadedFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-400">Drop script file or click to upload</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {uploadedFile && selectedProjectId && !isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex justify-center"
            >
              <Button 
                onClick={analyzeScript}
                className="shilpi-gradient text-white px-8 py-6 text-lg shadow-lg shadow-amber-500/20"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Script with AI
              </Button>
            </motion.div>
          )}

          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 space-y-4"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{progressMessage}</span>
                <span className="text-amber-400 font-medium">{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2 bg-slate-800" />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Scenes", value: analysis.summary?.total_scenes || 0, icon: Hash, color: "amber" },
              { label: "Locations", value: analysis.summary?.location_count || 0, icon: MapPin, color: "blue" },
              { label: "Characters", value: analysis.summary?.character_count || 0, icon: Users, color: "emerald" },
              { label: "Est. Shoot Days", value: analysis.summary?.estimated_shoot_days || 0, icon: Clock, color: "purple" },
              { label: "Budget Low", value: `$${((analysis.summary?.budget_range?.low || 0) / 1000).toFixed(0)}k`, icon: DollarSign, color: "green" },
              { label: "Budget High", value: `$${((analysis.summary?.budget_range?.high || 0) / 1000).toFixed(0)}k`, icon: DollarSign, color: "red" },
            ].map((stat, i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Genre & Tone */}
          {analysis.summary?.genre && (
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-amber-400" />
                    <span className="text-slate-400">Genre:</span>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      {analysis.summary.genre}
                    </Badge>
                  </div>
                  {analysis.summary.primary_tone && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <span className="text-slate-400">Tone:</span>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {analysis.summary.primary_tone}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Tabs */}
          <Tabs defaultValue="scenes" className="space-y-4">
            <TabsList className="bg-slate-900/50 border border-slate-800/50 p-1">
              <TabsTrigger value="scenes" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Scenes
              </TabsTrigger>
              <TabsTrigger value="characters" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                Characters
              </TabsTrigger>
              <TabsTrigger value="locations" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <MapPin className="w-4 h-4 mr-2" />
                Locations
              </TabsTrigger>
              <TabsTrigger value="props" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <Package className="w-4 h-4 mr-2" />
                Props
              </TabsTrigger>
              <TabsTrigger value="equipment" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <Camera className="w-4 h-4 mr-2" />
                Equipment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scenes">
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800/50 hover:bg-transparent">
                          <TableHead className="text-slate-400">Scene</TableHead>
                          <TableHead className="text-slate-400">Description</TableHead>
                          <TableHead className="text-slate-400">INT/EXT</TableHead>
                          <TableHead className="text-slate-400">Time</TableHead>
                          <TableHead className="text-slate-400">Characters</TableHead>
                          <TableHead className="text-slate-400">Est. Hours</TableHead>
                          <TableHead className="text-slate-400">Complexity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysis.scenes?.map((scene, i) => (
                          <TableRow key={i} className="border-slate-800/50">
                            <TableCell className="text-white font-mono">{scene.scene_number}</TableCell>
                            <TableCell className="text-slate-300 max-w-xs truncate">{scene.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${
                                scene.int_ext === "INT" 
                                  ? "border-blue-500/30 text-blue-400" 
                                  : "border-emerald-500/30 text-emerald-400"
                              }`}>
                                {scene.int_ext}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTimeIcon(scene.time_of_day)}
                                <span className="text-slate-300">{scene.time_of_day}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-400">{scene.characters?.length || 0}</TableCell>
                            <TableCell className="text-slate-300">{scene.estimated_shooting_time}h</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map((n) => (
                                  <div 
                                    key={n} 
                                    className={`w-2 h-2 rounded-full ${
                                      n <= (scene.complexity_score || 1) 
                                        ? "bg-amber-400" 
                                        : "bg-slate-700"
                                    }`} 
                                  />
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="characters">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.characters?.map((char, i) => (
                  <Card key={i} className="bg-slate-900/50 border-slate-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{char.name}</h3>
                          <p className="text-sm text-slate-500 mt-1">{char.description}</p>
                        </div>
                        {char.is_lead && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Lead</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                        <FileText className="w-4 h-4" />
                        {char.scene_count} scenes
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="locations">
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.locations_mentioned?.map((loc, i) => (
                  <Card key={i} className="bg-slate-900/50 border-slate-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${
                              loc.int_ext === "INT" 
                                ? "border-blue-500/30 text-blue-400" 
                                : "border-emerald-500/30 text-emerald-400"
                            }`}>
                              {loc.int_ext}
                            </Badge>
                            <h3 className="font-semibold text-white">{loc.name}</h3>
                          </div>
                          <p className="text-sm text-slate-500 mt-2">{loc.description}</p>
                        </div>
                      </div>
                      {loc.requirements?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 mb-2">Requirements:</p>
                          <div className="flex flex-wrap gap-1">
                            {loc.requirements.map((req, j) => (
                              <Badge key={j} variant="outline" className="text-xs border-slate-700 text-slate-400">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-slate-400">{loc.scene_count} scenes</span>
                        <Link to={createPageUrl(`Locations?projectId=${selectedProjectId}&locationId=${loc.id}`)}>
                          <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300">
                            Find Locations <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="props">
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysis.props?.map((prop, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{prop.name}</span>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {prop.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Scenes: {prop.scenes?.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="equipment">
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysis.equipment_needs?.map((eq, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{eq.name}</span>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {eq.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Scenes: {eq.scenes?.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && selectedProjectId && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Script Analyzed Yet</h3>
            <p className="text-slate-400 text-center max-w-md">
              Upload a screenplay file (PDF, TXT, or Final Draft) to get an instant AI-powered breakdown of scenes, characters, locations, and more.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}