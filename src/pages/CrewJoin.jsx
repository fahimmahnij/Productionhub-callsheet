import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Clapperboard, 
  User, 
  Mail, 
  Phone,
  AlertCircle,
  Heart,
  Utensils,
  Shield,
  Car,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Camera
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

const DEPARTMENTS = [
  "Production", "Direction", "Camera", "Lighting", "Sound", "Art", 
  "Wardrobe", "Makeup", "Grip", "Electric", "Locations", "Transportation",
  "Catering", "Post-Production", "VFX", "Stunts", "Other"
];

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Nut Allergy", "Dairy-Free"
];

export default function CrewJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    departments: [],
    primary_role: "",
    emergency_contact: {
      name: "",
      phone: "",
      relationship: ""
    },
    dietary_restrictions: [],
    allergies: "",
    certifications: [],
    vehicle_info: {
      make_model: "",
      color: "",
      license_plate: ""
    },
    notes: ""
  });

  const { data: invite, isLoading: inviteLoading, error: inviteError } = useQuery({
    queryKey: ['invite', token],
    queryFn: async () => {
      const invites = await base44.entities.CrewInvite.filter({ token });
      if (!invites?.[0]) throw new Error("Invalid invite link");
      if (invites[0].used) throw new Error("This invite link has already been used");
      if (new Date(invites[0].expires_at) < new Date()) throw new Error("This invite link has expired");
      return invites[0];
    },
    enabled: !!token
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Create crew member
      const crewMember = await base44.entities.CrewMember.create(formData);
      
      // Create project assignment
      await base44.entities.ProjectAssignment.create({
        project_id: invite.project_id,
        crew_member_id: crewMember.id,
        crew_member_name: formData.full_name,
        department: invite.department || formData.departments[0] || "Other",
        role: invite.role || formData.primary_role,
        status: "confirmed"
      });
      
      // Mark invite as used
      await base44.entities.CrewInvite.update(invite.id, {
        used: true,
        used_by: formData.email
      });
      
      return crewMember;
    },
    onSuccess: () => {
      setSubmitted(true);
    }
  });

  const handleSubmit = () => {
    if (!formData.full_name || !formData.email) return;
    submitMutation.mutate();
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDietary = (diet) => {
    setFormData(prev => ({
      ...prev,
      dietary_restrictions: prev.dietary_restrictions.includes(diet)
        ? prev.dietary_restrictions.filter(d => d !== diet)
        : [...prev.dietary_restrictions, diet]
    }));
  };

  const toggleDepartment = (dept) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept]
    }));
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/80 border-slate-800 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Invalid Link</h2>
            <p className="text-slate-400">This invite link is not valid. Please request a new one from your production team.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inviteLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/80 border-slate-800 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Link Error</h2>
            <p className="text-slate-400">{inviteError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="bg-slate-900/80 border-slate-800 max-w-md w-full">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
              <p className="text-slate-400 mb-6">
                Welcome to <span className="text-amber-400 font-semibold">{invite.project_name}</span>! 
                Your profile has been saved. The production team will be in touch soon with call times and details.
              </p>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-400">
                  Keep an eye on your email ({formData.email}) for call sheets and updates!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const steps = [
    { title: "Basic Info", icon: User },
    { title: "Emergency", icon: Heart },
    { title: "Details", icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 mb-4">
            <Clapperboard className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-medium">Shilpi</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Join the Crew
          </h1>
          <p className="text-slate-400">
            Welcome to <span className="text-amber-400 font-semibold">{invite.project_name}</span>
          </p>
          {invite.department && (
            <p className="text-slate-500 text-sm mt-1">
              Department: {invite.department} {invite.role && `• Role: ${invite.role}`}
            </p>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => setStep(i + 1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step === i + 1 
                    ? "bg-amber-500 text-white" 
                    : step > i + 1 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800/50 text-slate-500"
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">{s.title}</span>
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="text-slate-300">Full Name *</Label>
                    <Input
                      placeholder="Your full legal name"
                      value={formData.full_name}
                      onChange={(e) => updateFormData("full_name", e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email *</Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone</Label>
                    <Input
                      type="tel"
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Primary Role</Label>
                    <Input
                      placeholder="e.g., Camera Operator, Gaffer, PA"
                      value={formData.primary_role}
                      onChange={(e) => updateFormData("primary_role", e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Departments</Label>
                    <div className="flex flex-wrap gap-2">
                      {DEPARTMENTS.map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => toggleDepartment(dept)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            formData.departments.includes(dept)
                              ? "bg-amber-500 text-white"
                              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
                    <p className="text-sm text-red-400 flex items-start gap-2">
                      <Heart className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      Emergency contact information is critical for set safety
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Emergency Contact Name</Label>
                    <Input
                      placeholder="Full name"
                      value={formData.emergency_contact.name}
                      onChange={(e) => updateFormData("emergency_contact", {
                        ...formData.emergency_contact,
                        name: e.target.value
                      })}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Emergency Contact Phone</Label>
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={formData.emergency_contact.phone}
                      onChange={(e) => updateFormData("emergency_contact", {
                        ...formData.emergency_contact,
                        phone: e.target.value
                      })}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Relationship</Label>
                    <Input
                      placeholder="e.g., Spouse, Parent, Sibling"
                      value={formData.emergency_contact.relationship}
                      onChange={(e) => updateFormData("emergency_contact", {
                        ...formData.emergency_contact,
                        relationship: e.target.value
                      })}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      Dietary Requirements
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((diet) => (
                        <button
                          key={diet}
                          type="button"
                          onClick={() => toggleDietary(diet)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            formData.dietary_restrictions.includes(diet)
                              ? "bg-purple-500 text-white"
                              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                          }`}
                        >
                          {diet}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Medical Allergies</Label>
                    <Textarea
                      placeholder="Any allergies the medic should know about..."
                      value={formData.allergies}
                      onChange={(e) => updateFormData("allergies", e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50 text-white min-h-20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Vehicle Info (for parking)
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Make/Model"
                        value={formData.vehicle_info.make_model}
                        onChange={(e) => updateFormData("vehicle_info", {
                          ...formData.vehicle_info,
                          make_model: e.target.value
                        })}
                        className="bg-slate-800/50 border-slate-700/50 text-white"
                      />
                      <Input
                        placeholder="Color"
                        value={formData.vehicle_info.color}
                        onChange={(e) => updateFormData("vehicle_info", {
                          ...formData.vehicle_info,
                          color: e.target.value
                        })}
                        className="bg-slate-800/50 border-slate-700/50 text-white"
                      />
                      <Input
                        placeholder="License"
                        value={formData.vehicle_info.license_plate}
                        onChange={(e) => updateFormData("vehicle_info", {
                          ...formData.vehicle_info,
                          license_plate: e.target.value
                        })}
                        className="bg-slate-800/50 border-slate-700/50 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Additional Notes</Label>
                    <Textarea
                      placeholder="Anything else the production should know..."
                      value={formData.notes}
                      onChange={(e) => updateFormData("notes", e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50 text-white min-h-20"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 border-slate-700/50"
                >
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!formData.full_name || !formData.email)}
                  className="flex-1 shilpi-gradient text-white"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="flex-1 shilpi-gradient text-white"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Complete Registration
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}