import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Film, 
  FileText, 
  MapPin, 
  Users, 
  Calendar,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Clapperboard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 10)
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crewMembers'],
    queryFn: () => base44.entities.CrewMember.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list()
  });

  const { data: shootDays = [] } = useQuery({
    queryKey: ['shootDays'],
    queryFn: () => base44.entities.ShootDay.list('-shoot_date', 5)
  });

  const stats = [
    { 
      label: "Active Projects", 
      value: projects.filter(p => p.status !== 'completed').length,
      total: projects.length,
      icon: Film,
      color: "from-amber-500 to-orange-500",
      href: "Projects"
    },
    { 
      label: "Crew Members", 
      value: crewMembers.length,
      icon: Users,
      color: "from-emerald-500 to-teal-500",
      href: "Crew"
    },
    { 
      label: "Locations Scouted", 
      value: locations.filter(l => l.status === 'confirmed').length,
      total: locations.length,
      icon: MapPin,
      color: "from-blue-500 to-indigo-500",
      href: "Locations"
    },
    { 
      label: "Upcoming Shoots", 
      value: shootDays.filter(s => new Date(s.shoot_date) >= new Date()).length,
      icon: Calendar,
      color: "from-purple-500 to-pink-500",
      href: "Schedule"
    },
  ];

  const statusColors = {
    draft: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    pre_production: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    production: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    post_production: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-white"
          >
            Welcome to Shilpi
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 mt-1"
          >
            Your AI-powered film production command center
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link to={createPageUrl("Projects")}>
            <Button className="shilpi-gradient text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={createPageUrl(stat.href)}>
              <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    {stat.total !== undefined && (
                      <p className="text-xs text-slate-500">of {stat.total} total</p>
                    )}
                    <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-amber-400" />
                Recent Projects
              </CardTitle>
              <Link to={createPageUrl("Projects")}>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <Clapperboard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-4">No projects yet</p>
                  <Link to={createPageUrl("Projects")}>
                    <Button className="shilpi-gradient text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 4).map((project) => (
                    <Link 
                      key={project.id} 
                      to={createPageUrl(`ScriptAnalysis?projectId=${project.id}`)}
                      className="block"
                    >
                      <div className="p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50 transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                              <Film className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                                {project.name}
                              </h3>
                              <p className="text-xs text-slate-500">
                                Created {format(new Date(project.created_date), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${statusColors[project.status || 'draft']} border`}>
                            {(project.status || 'draft').replace('_', ' ')}
                          </Badge>
                        </div>
                        {project.script_analysis_results?.summary && (
                          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {project.script_analysis_results.summary.total_scenes || 0} scenes
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {project.script_analysis_results.summary.location_count || 0} locations
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {project.script_analysis_results.summary.character_count || 0} characters
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Upcoming */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Quick Actions */}
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={createPageUrl("ScriptAnalysis")} className="block">
                <Button variant="outline" className="w-full justify-start border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300 hover:text-white">
                  <FileText className="w-4 h-4 mr-2 text-amber-400" />
                  Analyze New Script
                </Button>
              </Link>
              <Link to={createPageUrl("Crew")} className="block">
                <Button variant="outline" className="w-full justify-start border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300 hover:text-white">
                  <Users className="w-4 h-4 mr-2 text-emerald-400" />
                  Invite Crew Members
                </Button>
              </Link>
              <Link to={createPageUrl("Locations")} className="block">
                <Button variant="outline" className="w-full justify-start border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300 hover:text-white">
                  <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                  Scout Locations
                </Button>
              </Link>
              <Link to={createPageUrl("CallSheets")} className="block">
                <Button variant="outline" className="w-full justify-start border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300 hover:text-white">
                  <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                  Generate Call Sheet
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Shoots */}
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Upcoming Shoots
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shootDays.filter(s => new Date(s.shoot_date) >= new Date()).length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No upcoming shoots</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shootDays
                    .filter(s => new Date(s.shoot_date) >= new Date())
                    .slice(0, 3)
                    .map((day) => (
                      <div key={day.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {format(new Date(day.shoot_date), "EEEE, MMM d")}
                            </p>
                            <p className="text-xs text-slate-500">
                              {day.location_name || "Location TBD"}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                            {day.scenes_scheduled?.length || 0} scenes
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}