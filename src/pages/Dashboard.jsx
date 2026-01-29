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
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    pre_production: "bg-amber-50 text-amber-700 border-amber-200",
    production: "bg-green-50 text-green-700 border-green-200",
    post_production: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-purple-50 text-purple-700 border-purple-200"
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-gray-900"
          >
            Welcome to Shilpi
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 mt-1"
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
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
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
              <Card className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    {stat.total !== undefined && (
                      <p className="text-xs text-gray-500">of {stat.total} total</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
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
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-600" />
                Recent Projects
              </CardTitle>
              <Link to={createPageUrl("Projects")}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
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
                  <Clapperboard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No projects yet</p>
                  <Link to={createPageUrl("Projects")}>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
                      <div className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                              <Film className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {project.name}
                              </h3>
                              <p className="text-xs text-gray-500">
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
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={createPageUrl("ScriptAnalysis")} className="block">
                <Button variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700">
                  <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                  Analyze New Script
                </Button>
              </Link>
              <Link to={createPageUrl("Crew")} className="block">
                <Button variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700">
                  <Users className="w-4 h-4 mr-2 text-green-600" />
                  Invite Crew Members
                </Button>
              </Link>
              <Link to={createPageUrl("Locations")} className="block">
                <Button variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  Scout Locations
                </Button>
              </Link>
              <Link to={createPageUrl("CallSheets")} className="block">
                <Button variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                  Generate Call Sheet
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Shoots */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Upcoming Shoots
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shootDays.filter(s => new Date(s.shoot_date) >= new Date()).length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No upcoming shoots</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shootDays
                    .filter(s => new Date(s.shoot_date) >= new Date())
                    .slice(0, 3)
                    .map((day) => (
                      <div key={day.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {format(new Date(day.shoot_date), "EEEE, MMM d")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {day.location_name || "Location TBD"}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-indigo-200 text-indigo-700">
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