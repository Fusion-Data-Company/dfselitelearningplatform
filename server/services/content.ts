import { storage } from "../storage";
import type { Track, Module, Lesson, InsertTrack, InsertModule, InsertLesson } from "@shared/schema";

export class ContentService {
  async initializeDefaultContent(): Promise<void> {
    try {
      // Check if content already exists
      const existingTracks = await storage.getTracks();
      if (existingTracks.length > 0) {
        console.log('Content already initialized');
        return;
      }

      // Create DFS-215 curriculum structure
      const tracks: InsertTrack[] = [
        {
          title: "Law & Ethics",
          description: "Professional responsibility, misappropriation, fiduciary duties, and 4-hour CE compliance",
          orderIndex: 1,
          ceHours: 4,
          isActive: true
        },
        {
          title: "Health Insurance & Managed Care",
          description: "HMO/PPO/EPO/POS models, balance billing, buyer's guide analysis",
          orderIndex: 2,
          ceHours: 0,
          isActive: true
        },
        {
          title: "Social Insurance (OASDI)",
          description: "OASDI elimination period, Medicare A/B/C/D, dual eligibility",
          orderIndex: 3,
          ceHours: 0,
          isActive: true
        },
        {
          title: "Disability Income Insurance",
          description: "Individual and group disability, elimination periods, benefit structures",
          orderIndex: 4,
          ceHours: 0,
          isActive: true
        },
        {
          title: "Life Insurance",
          description: "Term, whole life, universal life, riders, replacement regulations",
          orderIndex: 5,
          ceHours: 0,
          isActive: true
        },
        {
          title: "Annuities & Variable Products",
          description: "Fixed and variable annuities, prospectus requirements, separate accounts",
          orderIndex: 6,
          ceHours: 0,
          isActive: true
        },
        {
          title: "FIGA/DFS/CFO",
          description: "Florida Insurance Guaranty Association, Department of Financial Services",
          orderIndex: 7,
          ceHours: 0,
          isActive: true
        }
      ];

      // Create tracks
      const createdTracks = [];
      for (const track of tracks) {
        const created = await storage.createTrack(track);
        createdTracks.push(created);
        console.log(`Created track: ${created.title}`);
      }

      // Create modules for each track
      for (const track of createdTracks) {
        await this.createModulesForTrack(track);
      }

      console.log('Default content initialization completed');
    } catch (error) {
      console.error('Error initializing default content:', error);
      throw error;
    }
  }

  private async createModulesForTrack(track: Track): Promise<void> {
    let modules: InsertModule[] = [];

    switch (track.title) {
      case "Law & Ethics":
        modules = [
          {
            trackId: track.id,
            title: "Professional Responsibility",
            description: "Agent duties, fiduciary obligations, ethical standards",
            orderIndex: 1
          },
          {
            trackId: track.id,
            title: "Misappropriation & Penalties",
            description: "Premium handling, trust accounts, criminal penalties",
            orderIndex: 2
          },
          {
            trackId: track.id,
            title: "Continuing Education Compliance",
            description: "CE requirements, record keeping, audit procedures",
            orderIndex: 3
          }
        ];
        break;

      case "Health Insurance & Managed Care":
        modules = [
          {
            trackId: track.id,
            title: "Traditional vs Managed Care",
            description: "Fee-for-service vs managed care fundamentals",
            orderIndex: 1
          },
          {
            trackId: track.id,
            title: "HMO/PPO/EPO/POS Models",
            description: "Network structures, referral requirements, cost-sharing",
            orderIndex: 2
          },
          {
            trackId: track.id,
            title: "Buyer's Guide Analysis",
            description: "Policy comparison tools, disclosure requirements",
            orderIndex: 3
          }
        ];
        break;

      case "Social Insurance (OASDI)":
        modules = [
          {
            trackId: track.id,
            title: "OASDI Overview",
            description: "Social Security disability benefits, eligibility",
            orderIndex: 1
          },
          {
            trackId: track.id,
            title: "Medicare Parts A/B/C/D",
            description: "Medicare coverage options, supplements, advantages",
            orderIndex: 2
          },
          {
            trackId: track.id,
            title: "Dual Eligibility & Medicaid",
            description: "Medicare-Medicaid coordination, special needs plans",
            orderIndex: 3
          }
        ];
        break;

      default:
        // Create generic modules for other tracks
        modules = [
          {
            trackId: track.id,
            title: `${track.title} Fundamentals`,
            description: `Core concepts and principles of ${track.title.toLowerCase()}`,
            orderIndex: 1
          },
          {
            trackId: track.id,
            title: `${track.title} Regulations`,
            description: `Regulatory framework and compliance requirements`,
            orderIndex: 2
          },
          {
            trackId: track.id,
            title: `${track.title} Applications`,
            description: `Practical applications and case studies`,
            orderIndex: 3
          }
        ];
        break;
    }

    // Create modules and their lessons
    for (const module of modules) {
      const createdModule = await storage.createModule(module);
      await this.createLessonsForModule(createdModule);
    }
  }

  private async createLessonsForModule(module: Module): Promise<void> {
    // Create sample lessons - in production these would be populated from actual content
    const lessons: InsertLesson[] = [];

    // Special case for HMO Balance Billing lesson (referenced in design)
    if (module.title.includes("HMO")) {
      lessons.push({
        moduleId: module.id,
        title: "HMO Balance Billing Restrictions",
        slug: "hmo-balance-billing",
        content: `# HMO Balance Billing Restrictions

## Learning Objectives
- Explain why balance billing is prohibited for HMO in-network providers
- Identify the pre-negotiated rate structure in managed care networks
- Describe PCP referral requirements and cost-sharing implications

## Key Concept: Balance Billing Restrictions

In Health Maintenance Organizations (HMOs), network providers are contractually prohibited from balance billing subscribers. This restriction is fundamental to the managed care model and directly impacts both provider compensation and subscriber cost exposure.

**Balance Billing:** The practice of billing a patient for the difference between the provider's charged amount and the amount paid by the insurance plan. This practice is prohibited for in-network HMO providers.

HMO providers agree to accept the plan's pre-negotiated rates as payment in full for covered services. Subscribers are only responsible for their designated cost-sharing amounts (copayments, coinsurance, or deductibles) as specified in their benefit structure.

## Primary Care Physician (PCP) Role

The PCP serves as the gatekeeper in the HMO model, coordinating care and managing referrals to specialists. This systematic approach helps control costs while ensuring appropriate utilization of healthcare services.`,
        objectives: [
          "Explain why balance billing is prohibited for HMO in-network providers",
          "Identify the pre-negotiated rate structure in managed care networks", 
          "Describe PCP referral requirements and cost-sharing implications"
        ],
        orderIndex: 1,
        duration: 45,
        ceHours: 0.75
      });
    }

    // Create additional sample lessons
    for (let i = lessons.length; i < 3; i++) {
      lessons.push({
        moduleId: module.id,
        title: `${module.title} - Lesson ${i + 1}`,
        slug: `${module.title.toLowerCase().replace(/\s+/g, '-')}-lesson-${i + 1}`,
        content: `# ${module.title} - Lesson ${i + 1}

This lesson covers important concepts related to ${module.title.toLowerCase()}.

## Learning Objectives
- Understand key principles
- Apply concepts to real-world scenarios
- Identify compliance requirements

## Content
Detailed lesson content would be populated from actual curriculum materials.`,
        objectives: ["Understand key principles", "Apply concepts to real-world scenarios"],
        orderIndex: i + 1,
        duration: 30,
        ceHours: 0.5
      });
    }

    // Create lessons in database
    for (const lesson of lessons) {
      await storage.createLesson(lesson);
    }
  }

  async getCourseStructure(): Promise<{
    tracks: (Track & {
      modules: (Module & {
        lessons: Lesson[];
      })[];
    })[];
  }> {
    const tracks = await storage.getTracks();
    const result = [];

    for (const track of tracks) {
      const modules = await storage.getModulesByTrack(track.id);
      const modulesWithLessons = [];

      for (const module of modules) {
        const lessons = await storage.getLessonsByModule(module.id);
        modulesWithLessons.push({
          ...module,
          lessons
        });
      }

      result.push({
        ...track,
        modules: modulesWithLessons
      });
    }

    return { tracks: result };
  }

  async getUserCourseProgress(userId: string): Promise<{
    tracks: Array<{
      id: string;
      title: string;
      progress: number;
      ceHours: number;
      completedLessons: number;
      totalLessons: number;
    }>;
    overallProgress: number;
  }> {
    const tracks = await storage.getTracks();
    const userProgress = await storage.getUserProgress(userId);
    
    const trackProgress = [];
    let totalLessons = 0;
    let completedLessons = 0;

    for (const track of tracks) {
      const modules = await storage.getModulesByTrack(track.id);
      let trackLessons = 0;
      let trackCompleted = 0;

      for (const module of modules) {
        const lessons = await storage.getLessonsByModule(module.id);
        trackLessons += lessons.length;
        
        for (const lesson of lessons) {
          const progress = userProgress.find(p => p.lessonId === lesson.id);
          if (progress?.completed) {
            trackCompleted++;
          }
        }
      }

      totalLessons += trackLessons;
      completedLessons += trackCompleted;

      const progressPercent = trackLessons > 0 ? (trackCompleted / trackLessons) * 100 : 0;

      trackProgress.push({
        id: track.id,
        title: track.title,
        progress: Math.round(progressPercent),
        ceHours: track.ceHours ?? 0,
        completedLessons: trackCompleted,
        totalLessons: trackLessons
      });
    }

    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return {
      tracks: trackProgress,
      overallProgress: Math.round(overallProgress)
    };
  }
}

export const contentService = new ContentService();
