import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import LessonPage from "@/pages/lesson";
import QuizPage from "@/pages/quiz";
import ExamPage from "@/pages/exam";
import IFlashPage from "@/pages/iflash";
import AgentsPage from "@/pages/agents";
import CETrackingPage from "@/pages/ce-tracking";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  // No authentication checks - allow access to all routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/lesson/:slug" component={LessonPage} />
      <Route path="/quiz/:bankId?" component={QuizPage} />
      <Route path="/exam/:bankId?" component={ExamPage} />
      <Route path="/iflash" component={IFlashPage} />
      <Route path="/agents" component={AgentsPage} />
      <Route path="/ce-tracking" component={CETrackingPage} />
      <Route path="/admin/:tab?" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
