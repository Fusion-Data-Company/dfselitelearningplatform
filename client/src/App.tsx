import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import LessonPage from "@/pages/lesson";
import TrackPage from "@/pages/track";
import InstructorPage from "@/pages/instructor";
import QuizPage from "@/pages/quiz";
import ExamPage from "@/pages/exam";
import IFlashPage from "@/pages/iflash";
import AgentsPage from "@/pages/agents";
import CETrackingPage from "@/pages/ce-tracking";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

// Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'agent-id'?: string;
      }, HTMLElement>;
    }
  }
}

function Router() {
  // No authentication checks - allow access to all routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/track/:trackId" component={TrackPage} />
      <Route path="/lesson/:slug" component={LessonPage} />
      <Route path="/instructor" component={InstructorPage} />
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
  useEffect(() => {
    // Load the ElevenLabs widget script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);
    
    return () => {
      // Clean up script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
          {/* ElevenLabs ConvAI Widget - positioned in bottom corner */}
          <elevenlabs-convai 
            agent-id="agent_6001k3vhprpbef7vt69kzsrvygdj"
            style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}
          />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
