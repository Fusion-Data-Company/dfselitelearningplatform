import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Award, 
  Calendar, 
  Clock, 
  Download, 
  FileText, 
  Target,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Star,
  Filter,
  ExternalLink
} from "lucide-react";

interface CERecord {
  id: string;
  userId: string;
  lessonId: string;
  hours: number;
  completedAt: string;
  certificateUrl?: string;
  lessonTitle?: string;
  trackTitle?: string;
}

interface CERequirement {
  category: string;
  required: number;
  completed: number;
  deadline: string;
  status: "completed" | "in-progress" | "overdue";
}

export default function CETrackingPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: ceRecords = [], isLoading: recordsLoading } = useQuery<CERecord[]>({
    queryKey: ['/api/ce/records'],
  });

  const { data: courseProgress } = useQuery({
    queryKey: ['/api/courses/progress'],
  });

  // Calculate CE statistics
  const totalHours = ceRecords.reduce((sum, record) => sum + record.hours, 0);
  const currentYearRecords = ceRecords.filter(record => 
    new Date(record.completedAt).getFullYear() === selectedYear
  );
  const currentYearHours = currentYearRecords.reduce((sum, record) => sum + record.hours, 0);

  // CE Requirements for Florida DFS-215
  const ceRequirements: CERequirement[] = [
    {
      category: "Law & Ethics (Required)",
      required: 4,
      completed: currentYearRecords.filter(r => r.trackTitle?.includes("Law & Ethics")).reduce((sum, r) => sum + r.hours, 0),
      deadline: `December 31, ${selectedYear}`,
      status: "in-progress"
    },
    {
      category: "Elective Credits",
      required: 20,
      completed: currentYearRecords.filter(r => !r.trackTitle?.includes("Law & Ethics")).reduce((sum, r) => sum + r.hours, 0),
      deadline: `December 31, ${selectedYear}`,
      status: "in-progress"
    }
  ];

  const totalRequired = ceRequirements.reduce((sum, req) => sum + req.required, 0);
  const totalCompleted = ceRequirements.reduce((sum, req) => sum + req.completed, 0);
  const overallProgress = Math.round((totalCompleted / totalRequired) * 100);

  return (
    <div className="min-h-screen education-bg">
      <Navigation />
      <Sidebar />
      
      <main className="ml-96 pt-16 min-h-screen">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="glassmorphism-card rounded-2xl p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-elite-glow">
                  <Award className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h1 className="cinzel text-4xl font-bold text-shimmer mb-2">
                    CE Compliance Tracking
                  </h1>
                  <p className="text-lg text-muted-foreground geist">
                    Monitor your continuing education progress and maintain Florida DFS-215 compliance
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Progress</span>
                  </div>
                  <p className="text-3xl font-bold text-primary">{overallProgress}%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-secondary" />
                    <span className="text-sm text-muted-foreground">This Year</span>
                  </div>
                  <p className="text-3xl font-bold text-secondary">{currentYearHours}h</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Total Hours</span>
                  </div>
                  <p className="text-3xl font-bold text-accent">{totalHours}h</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-chart-2" />
                    <span className="text-sm text-muted-foreground">Certificates</span>
                  </div>
                  <p className="text-3xl font-bold text-chart-2">{ceRecords.filter(r => r.certificateUrl).length}</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
              <Card className="glassmorphism border-border">
                <CardContent className="p-4">
                  <TabsList className="grid grid-cols-4 w-full bg-transparent">
                    <TabsTrigger value="overview" className="data-[state=active]:section-active">
                      <Target className="w-4 h-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="requirements" className="data-[state=active]:section-active">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Requirements
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:section-active">
                      <Calendar className="w-4 h-4 mr-2" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="certificates" className="data-[state=active]:section-active">
                      <Award className="w-4 h-4 mr-2" />
                      Certificates
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Progress Overview */}
                    <Card className="education-card border-primary/20">
                      <CardContent className="p-6">
                        <h3 className="cinzel text-xl font-bold mb-6">CE Progress {selectedYear}</h3>
                        
                        <div className="space-y-6">
                          {ceRequirements.map((req, index) => (
                            <div key={index} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    req.completed >= req.required ? 'bg-green-500' :
                                    req.completed > 0 ? 'bg-blue-500' : 'bg-red-500'
                                  }`}></div>
                                  <h4 className="font-semibold">{req.category}</h4>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{req.completed} / {req.required} hours</p>
                                  <p className="text-xs text-muted-foreground">Due: {req.deadline}</p>
                                </div>
                              </div>
                              <Progress value={(req.completed / req.required) * 100} className="h-3" />
                              {req.completed >= req.required && (
                                <div className="flex items-center space-x-2 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm font-medium">Requirement Complete</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="education-card border-secondary/20">
                      <CardContent className="p-6">
                        <h3 className="cinzel text-xl font-bold mb-6">Recent CE Activity</h3>
                        
                        {recordsLoading ? (
                          <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="animate-pulse">
                                <div className="h-16 bg-muted rounded-xl"></div>
                              </div>
                            ))}
                          </div>
                        ) : currentYearRecords.length > 0 ? (
                          <div className="space-y-4">
                            {currentYearRecords.slice(0, 5).map((record) => (
                              <div key={record.id} className="flex items-center justify-between p-4 glassmorphism-card rounded-xl border border-border/50">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{record.lessonTitle || `Lesson ${record.lessonId.slice(0, 8)}`}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {record.trackTitle} • {new Date(record.completedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-primary/20 text-primary border-primary/30">
                                    +{record.hours} hrs
                                  </Badge>
                                  {record.certificateUrl && (
                                    <Button variant="ghost" size="sm" className="ml-2">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No CE activity recorded for {selectedYear}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Compliance Status */}
                    <Card className="education-card border-accent/20">
                      <CardContent className="p-6">
                        <h3 className="cinzel text-lg font-bold mb-4">Compliance Status</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 glassmorphism-card rounded-lg border border-border/30">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium">DFS-215 Active</span>
                            </div>
                            <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                              Current
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 glassmorphism-card rounded-lg border border-border/30">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium">Next Renewal</span>
                            </div>
                            <span className="text-sm text-muted-foreground">Dec 31, 2025</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 glassmorphism-card rounded-lg border border-border/30">
                            <div className="flex items-center space-x-2">
                              <Star className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">CE Credits Needed</span>
                            </div>
                            <span className="text-sm font-medium">{Math.max(0, totalRequired - totalCompleted)} hrs</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="education-card border-chart-2/20">
                      <CardContent className="p-6">
                        <h3 className="cinzel text-lg font-bold mb-4">Quick Actions</h3>
                        
                        <div className="space-y-3">
                          <Button className="w-full floating-action justify-start">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            View Course Catalog
                          </Button>
                          <Button variant="outline" className="w-full justify-start border-border/50">
                            <Download className="w-4 h-4 mr-2" />
                            Export CE Report
                          </Button>
                          <Button variant="outline" className="w-full justify-start border-border/50">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            DFS Portal
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements">
                <Card className="education-card border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="cinzel text-xl font-bold mb-6">Florida DFS-215 CE Requirements</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-6 glassmorphism-card rounded-xl border border-primary/30">
                          <div className="flex items-center space-x-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-primary" />
                            <h4 className="font-bold text-lg">Mandatory Requirements</h4>
                          </div>
                          <ul className="space-y-3 text-sm">
                            <li className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                              <span>4 hours of Law & Ethics (mandatory)</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                              <span>20 hours of elective continuing education</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                              <span>Complete by license renewal date</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="p-6 glassmorphism-card rounded-xl border border-secondary/30">
                          <h4 className="font-bold mb-3">Approved Course Categories</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Professional responsibility and ethics</li>
                            <li>• Florida insurance laws and regulations</li>
                            <li>• Health insurance products and services</li>
                            <li>• Life insurance and annuities</li>
                            <li>• Disability income insurance</li>
                            <li>• Medicare and Social Security</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-6 glassmorphism-card rounded-xl border border-accent/30">
                          <h4 className="font-bold mb-3">Important Deadlines</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm">Current License Period:</span>
                              <Badge variant="outline">2024-2025</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Renewal Deadline:</span>
                              <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Dec 31, 2025</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">CE Completion Due:</span>
                              <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">Nov 15, 2025</Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6 glassmorphism-card rounded-xl border border-chart-2/30">
                          <h4 className="font-bold mb-3">Compliance Tips</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Keep detailed records of all CE activities</li>
                            <li>• Save certificates and completion documents</li>
                            <li>• Complete Law & Ethics requirement first</li>
                            <li>• Don't wait until the last minute</li>
                            <li>• Verify course approval status</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <Card className="education-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="cinzel text-xl font-bold">CE History</h3>
                      <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select 
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="bg-background border border-border rounded-lg px-3 py-1 text-sm"
                        >
                          <option value={2025}>2025</option>
                          <option value={2024}>2024</option>
                          <option value={2023}>2023</option>
                        </select>
                      </div>
                    </div>
                    
                    {recordsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-20 bg-muted rounded-xl"></div>
                          </div>
                        ))}
                      </div>
                    ) : currentYearRecords.length > 0 ? (
                      <div className="space-y-4">
                        {currentYearRecords.map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-4 glassmorphism-card rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-medium">{record.lessonTitle || `Lesson ${record.lessonId.slice(0, 8)}`}</p>
                                <p className="text-sm text-muted-foreground">
                                  {record.trackTitle || "DFS-215 Course"} • {new Date(record.completedAt).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Completed at {new Date(record.completedAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">
                                  {record.hours} CE Hours
                                </Badge>
                                {record.certificateUrl && (
                                  <div>
                                    <Badge variant="outline" className="text-xs">
                                      Certificate Available
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h4 className="font-bold text-lg mb-2">No CE Records for {selectedYear}</h4>
                        <p className="text-muted-foreground mb-6">
                          Start completing courses to build your CE record.
                        </p>
                        <Button className="floating-action">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Browse Courses
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Certificates Tab */}
              <TabsContent value="certificates">
                <Card className="education-card border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="cinzel text-xl font-bold mb-6">CE Certificates</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ceRecords.filter(r => r.certificateUrl).map((record) => (
                        <Card key={record.id} className="education-card border-secondary/20 hover:border-secondary/50 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <Award className="w-8 h-8 text-secondary" />
                              <div>
                                <h4 className="font-bold">{record.trackTitle || "DFS-215"}</h4>
                                <p className="text-sm text-muted-foreground">{record.hours} CE Hours</p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Completed: {new Date(record.completedAt).toLocaleDateString()}
                            </p>
                            <Button className="w-full floating-action">
                              <Download className="w-4 h-4 mr-2" />
                              Download Certificate
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {ceRecords.filter(r => r.certificateUrl).length === 0 && (
                        <div className="col-span-full text-center py-12">
                          <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <h4 className="font-bold text-lg mb-2">No Certificates Yet</h4>
                          <p className="text-muted-foreground mb-6">
                            Complete CE courses to earn certificates.
                          </p>
                          <Button className="floating-action">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Start Learning
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}