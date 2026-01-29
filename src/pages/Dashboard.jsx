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
    draft: "bg-okeefe-earth/20 text-okeefe-earth border-okeefe-earth/30",
    pre_production: "bg-okeefe-terracotta/20 text-okeefe-terracotta border-okeefe-terracotta/30",
    production: "bg-okeefe-sage/20 text-okeefe-sage border-okeefe-sage/30",
    post_production: "bg-okeefe-sky/20 text-okeefe-sky border-okeefe-sky/30",
    completed: "bg-okeefe-rose/20 text-okeefe-rose border-okeefe-rose/30"
  };

  return (
    <div className="p-4 md:p-8 space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif italic text-okeefe-earth"
          >
            Welcome to Shilpi
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-okeefe-earth/60 mt-2 font-light"
          >
            Your AI-powered film production studio
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link to={createPageUrl("Projects")}>
            <Button className="okeefe-gradient text-okeefe-cream shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-6 soft-shadow">
              <Plus className="w-5 h-5 mr-2" />
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
              <Card className="bg-okeefe-cream/60 backdrop-blur-sm border-2 border-okeefe-earth/20 hover:border-okeefe-terracotta/40 transition-all duration-300 cursor-pointer group rounded-3xl soft-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${stat.color.replace('from-', 'from-okeefe-').replace('to-', 'to-okeefe-').replace('amber', 'terracotta').replace('emerald', 'sage').replace('blue', 'sky').replace('purple', 'rose')} flex items-center justify-center soft-shadow group-hover:scale-110 transition-all duration-500 organic-blob`}>
                      <stat.icon className="w-6 h-6 text-okeefe-cream" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-okeefe-earth/40 group-hover:text-okeefe-terracotta group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <div className="mt-4">
                    <p className="text-4xl font-light text-okeefe-earth">{stat.value}</p>
                    {stat.total !== undefined && (
                      <p className="text-xs text-okeefe-earth/50 font-light">of {stat.total} total</p>
                    )}
                    <p className="text-sm text-okeefe-earth/70 mt-2 font-light">{stat.label}</p>
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
          <Card className="bg-okeefe-cream/60 backdrop-blur-sm border-2 border-okeefe-earth/20 rounded-3xl soft-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-light text-okeefe-earth flex items-center gap-2">
                <Film className="w-5 h-5 text-okeefe-terracotta" />
                Recent Projects
              </CardTitle>
              <Link to={createPageUrl("Projects")}>
                <Button variant="ghost" size="sm" className="text-okeefe-earth/60 hover:text-okeefe-terracotta rounded-full transition-colors duration-300">
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
                  <Clapperboard className="w-12 h-12 text-okeefe-earth/30 mx-auto mb-3" />
                  <p className="text-okeefe-earth/60 mb-4 font-light">No projects yet</p>
                  <Link to={createPageUrl("Projects")}>
                    <Button className="okeefe-gradient text-okeefe-cream rounded-full px-6 soft-shadow">
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
                      <div className="p-4 rounded-2xl bg-okeefe-sand/40 hover:bg-okeefe-sand/60 border-2 border-okeefe-earth/10 hover:border-okeefe-terracotta/30 transition-all duration-300 group soft-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-okeefe-terracotta to-okeefe-rose flex items-center justify-center organic-blob">
                              <Film className="w-5 h-5 text-okeefe-cream" />
                            </div>
                            <div>
                              <h3 className="font-light text-okeefe-earth group-hover:text-okeefe-terracotta transition-colors duration-300">
                                {project.name}
                              </h3>
                              <p className="text-xs text-okeefe-earth/50 font-light">
                                Created {format(new Date(project.created_date), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${statusColors[project.status || 'draft']} border rounded-full px-3 py-1`}>
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
          <Card className="bg-okeefe-cream/60 backdrop-blur-sm border-2 border-okeefe-earth/20 rounded-3xl soft-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-light text-okeefe-earth flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-okeefe-terracotta" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={createPageUrl("ScriptAnalysis")} className="block">
                <Button variant="outline" className="w-full justify-start border-2 border-okeefe-earth/20 bg-okeefe-sand/30 hover:bg-okeefe-sand/50 text-okeefe-earth hover:text-okeefe-terracotta rounded-full transition-all duration-300">
                  <FileText className="w-4 h-4 mr-2 text-okeefe-terracotta" />
                  Analyze New Script
                </Button>
              </Link>
              <Link to={createPageUrl("Crew")} className="block">
                <Button variant="outline" className="w-full justify-start border-2 border-okeefe-earth/20 bg-okeefe-sand/30 hover:bg-okeefe-sand/50 text-okeefe-earth hover:text-okeefe-terracotta rounded-full transition-all duration-300">
                  <Users className="w-4 h-4 mr-2 text-okeefe-sage" />
                  Invite Crew Members
                </Button>
              </Link>
              <Link to={createPageUrl("Locations")} className="block">
                <Button variant="outline" className="w-full justify-start border-2 border-okeefe-earth/20 bg-okeefe-sand/30 hover:bg-okeefe-sand/50 text-okeefe-earth hover:text-okeefe-terracotta rounded-full transition-all duration-300">
                  <MapPin className="w-4 h-4 mr-2 text-okeefe-sky" />
                  Scout Locations
                </Button>
              </Link>
              <Link to={createPageUrl("CallSheets")} className="block">
                <Button variant="outline" className="w-full justify-start border-2 border-okeefe-earth/20 bg-okeefe-sand/30 hover:bg-okeefe-sand/50 text-okeefe-earth hover:text-okeefe-terracotta rounded-full transition-all duration-300">
                  <Calendar className="w-4 h-4 mr-2 text-okeefe-rose" />
                  Generate Call Sheet
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Shoots */}
          <Card className="bg-okeefe-cream/60 backdrop-blur-sm border-2 border-okeefe-earth/20 rounded-3xl soft-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-light text-okeefe-earth flex items-center gap-2">
                <Calendar className="w-5 h-5 text-okeefe-terracotta" />
                Upcoming Shoots
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shootDays.filter(s => new Date(s.shoot_date) >= new Date()).length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 text-okeefe-earth/30 mx-auto mb-2" />
                  <p className="text-sm text-okeefe-earth/60 font-light">No upcoming shoots</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shootDays
                    .filter(s => new Date(s.shoot_date) >= new Date())
                    .slice(0, 3)
                    .map((day) => (
                      <div key={day.id} className="p-3 rounded-2xl bg-okeefe-sand/40 border-2 border-okeefe-earth/10 soft-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-light text-okeefe-earth">
                              {format(new Date(day.shoot_date), "EEEE, MMM d")}
                            </p>
                            <p className="text-xs text-okeefe-earth/50 font-light">
                              {day.location_name || "Location TBD"}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-okeefe-terracotta/30 text-okeefe-terracotta rounded-full">
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