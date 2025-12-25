import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useApp } from "@/lib/appContext";
import { BottomNav } from '@/components/BottomNav';
import { QuickExitMenu } from '@/components/QuickExitMenu';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Lightbulb, 
  HelpCircle, 
  Phone,
  Shield,
  Settings,
  TestTube,
  AlertTriangle,
  Brain,
  Battery,
  Wifi,
  Eye,
  Smartphone,
  Target,
  ExternalLink,
  MessageCircle,
  Bug,
  Sparkles
} from "lucide-react";

const HelpScreen = () => {
  const { setScreen } = useApp();
  const [activeSection, setActiveSection] = useState<'tutorials' | 'tips' | 'faq' | 'resources'>('tutorials');

  const videoTutorials = [
    {
      id: 1,
      title: "Getting Started with SafeGuard",
      description: "Learn the basics of setting up your safety app",
      duration: "2:30",
      icon: Shield,
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      title: "Using the Panic Button",
      description: "How to trigger and cancel emergency alerts",
      duration: "1:45",
      icon: AlertTriangle,
      color: "from-red-500 to-red-600"
    },
    {
      id: 3,
      title: "Voice & Gesture Detection",
      description: "Setting up AI-powered detection features",
      duration: "2:15",
      icon: Brain,
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 4,
      title: "Disguise Mode Explained",
      description: "How to hide the app in plain sight",
      duration: "1:30",
      icon: Eye,
      color: "from-amber-500 to-amber-600"
    },
    {
      id: 5,
      title: "Complete Settings Guide",
      description: "Walkthrough of all configuration options",
      duration: "3:45",
      icon: Settings,
      color: "from-slate-500 to-slate-600"
    },
    {
      id: 6,
      title: "Testing Features Safely",
      description: "How to test without alerting contacts",
      duration: "1:20",
      icon: TestTube,
      color: "from-green-500 to-green-600"
    }
  ];

  const quickTips = [
    {
      id: 1,
      title: "Test SOS Without Alerting Contacts",
      content: "Go to Settings → Advanced → Test Mode. Enable 'Test Mode' to practice using all features without sending real alerts. A banner will remind you when test mode is active.",
      icon: TestTube
    },
    {
      id: 2,
      title: "What to Do After a False Alarm",
      content: "If you accidentally trigger an alert: 1) Press 'I'm Safe' immediately, 2) Your contacts will receive a 'False Alarm' notification, 3) Consider adjusting AI sensitivity in Settings → AI Configuration.",
      icon: AlertTriangle
    },
    {
      id: 3,
      title: "Training AI for Better Accuracy",
      content: "The AI learns from your usage patterns. For voice detection: record keywords in different tones and volumes. For gestures: practice in various lighting conditions. Check AI stats in Settings → AI Configuration.",
      icon: Brain
    },
    {
      id: 4,
      title: "Battery Optimization Tips",
      content: "To extend battery life: 1) Enable Battery Saver mode on dashboard, 2) Use 30-second location updates instead of 10-second, 3) Disable features you don't use, 4) Allow the app to run in Doze mode when safe.",
      icon: Battery
    }
  ];

  const faqs = [
    {
      question: "Does this work without internet?",
      answer: "Yes! SMS alerts and GPS coordinates will be sent even without internet. Audio recording and photo capture work offline and sync when connected. Some features like WhatsApp messaging require internet."
    },
    {
      question: "Will it drain my battery?",
      answer: "The app is optimized for minimal battery use. In standby mode, it uses less than 2% per hour. During an active alert, battery usage increases for GPS and recording. Battery Saver mode reduces this further."
    },
    {
      question: "Can someone detect this is a safety app?",
      answer: "When Disguise Mode is enabled, the app appears as a calculator, notes app, or weather app. The real icon is hidden, and opening the disguised app shows fake content until you enter your password."
    },
    {
      question: "What if my phone is taken away?",
      answer: "If an alert was triggered before your phone was taken, location sharing and recording continue in the background. Contacts receive continuous updates. The app can also be configured to auto-trigger if movement patterns suggest danger."
    },
    {
      question: "How accurate is the AI detection?",
      answer: "AI accuracy improves with use. Initial accuracy is around 85% for voice keywords and 90% for gestures. After training with your voice and movements, accuracy typically reaches 95%+. You can view stats in Settings."
    },
    {
      question: "What happens if I lose my phone?",
      answer: "Your emergency contacts can request your last known location. If an alert was active, they have the full location history. Consider enabling cloud backup in Settings → Privacy & Data for data recovery."
    }
  ];

  const emergencyResources = [
    {
      title: "Emergency Helplines",
      description: "National emergency numbers by country",
      icon: Phone,
      items: [
        "USA: 911 (Emergency), 988 (Mental Health)",
        "UK: 999 (Emergency), 116 123 (Samaritans)",
        "India: 112 (Emergency), 181 (Women)",
        "Australia: 000 (Emergency), 1800 737 732"
      ]
    },
    {
      title: "App Support",
      description: "Get help from our team",
      icon: MessageCircle,
      action: "Contact Support"
    },
    {
      title: "Report a Bug",
      description: "Help us improve the app",
      icon: Bug,
      action: "Report Issue"
    },
    {
      title: "Request a Feature",
      description: "Suggest new features or improvements",
      icon: Sparkles,
      action: "Submit Request"
    }
  ];

  const renderTutorials = () => (
    <div className="space-y-3">
      {videoTutorials.map((tutorial) => (
        <Card key={tutorial.id} className="bg-card/50 border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 bg-gradient-to-br ${tutorial.color} flex items-center justify-center flex-shrink-0`}>
                <Play className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 py-3 pr-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm">{tutorial.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{tutorial.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{tutorial.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderTips = () => (
    <div className="space-y-3">
      {quickTips.map((tip) => (
        <Card key={tip.id} className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <tip.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">{tip.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderFAQ = () => (
    <Accordion type="single" collapsible className="space-y-2">
      {faqs.map((faq, index) => (
        <AccordionItem 
          key={index} 
          value={`faq-${index}`}
          className="bg-card/50 border border-border/50 rounded-lg px-4"
        >
          <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
            <div className="flex items-center gap-3 text-left">
              <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{faq.question}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground pb-4 pl-7 leading-relaxed">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  const renderResources = () => (
    <div className="space-y-4">
      {/* Emergency Helplines */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Phone className="w-4 h-4 text-red-500" />
            Emergency Helplines
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {emergencyResources[0].items?.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Support Options */}
      <div className="grid grid-cols-1 gap-3">
        {emergencyResources.slice(1).map((resource, index) => (
          <Card key={index} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <resource.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{resource.title}</h3>
                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  {resource.action}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* App Info */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">SafeGuard</h3>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            </div>
            <div className="flex justify-center gap-4 pt-2">
              <Button variant="ghost" size="sm" className="text-xs">
                Terms of Service
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Privacy Policy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const sections = [
    { id: 'tutorials' as const, label: 'Tutorials', icon: Play },
    { id: 'tips' as const, label: 'Tips', icon: Lightbulb },
    { id: 'faq' as const, label: 'FAQ', icon: HelpCircle },
    { id: 'resources' as const, label: 'Resources', icon: Phone }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScreen('dashboard')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Help & Tutorials</h1>
            <p className="text-xs text-muted-foreground">Learn how to stay safe</p>
          </div>
          <QuickExitMenu />
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 text-xs gap-1 ${
                activeSection === section.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground'
              }`}
            >
              <section.icon className="w-3 h-3" />
              {section.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {activeSection === 'tutorials' && renderTutorials()}
        {activeSection === 'tips' && renderTips()}
        {activeSection === 'faq' && renderFAQ()}
        {activeSection === 'resources' && renderResources()}
      </div>
      
      <BottomNav activeTab="help" />
    </div>
  );
};

export default HelpScreen;
