import { enhancedStorage } from './enhanced-storage';
import { storage } from '../storage';

export class SampleDFS215ContentService {

  /**
   * Create sample DFS-215 structured content for a lesson
   */
  async populateSampleLesson(lessonId: string): Promise<void> {
    console.log(`📚 Creating DFS-215 structured content for lesson: ${lessonId}`);

    // Define comprehensive DFS-215 lesson structure
    const dfs215Structure = {
      stages: [
        {
          title: 'Introduction',
          order: 1,
          gateRule: { require_all: true },
          checkpoints: [
            {
              order: 1,
              kind: 'ack' as const,
              label: '[Note] Lesson Overview',
              prompt: 'Welcome to this comprehensive lesson on Florida Insurance Law. This lesson follows the DFS-215 Blended Self-Study methodology and covers essential material for professional practice.',
              explain: 'This acknowledgment ensures you understand the lesson format and objectives before proceeding.'
            }
          ]
        },
        {
          title: 'Core Concepts',
          order: 2,
          gateRule: { require_all: true },
          checkpoints: [
            {
              order: 1,
              kind: 'ack' as const,
              label: '[Note] Reading Material',
              prompt: 'Review the fundamental concepts and principles that form the foundation of Florida insurance regulation. Understanding these concepts is critical for professional practice and examination success.',
              explain: 'Carefully read and understand all material before proceeding to assessment checkpoints.'
            },
            {
              order: 2,
              kind: 'task' as const,
              label: '[Identify] Regulatory Framework',
              prompt: 'Identify the key components of Florida insurance regulatory framework including the Department of Financial Services, licensing requirements, and oversight mechanisms.',
              tags: ['regulatory', 'framework', 'dfs'],
              explain: 'The regulatory framework establishes the foundation for all insurance operations in Florida.'
            },
            {
              order: 3,
              kind: 'short_answer' as const,
              label: '[Define] Fiduciary Responsibility',
              prompt: 'Define "fiduciary responsibility" as it applies to insurance professionals and provide two specific examples of how this principle guides professional conduct.',
              answerKey: {
                contains: ['fiduciary', 'trust', 'client interests', 'ethical duty'],
                examples: ['client confidentiality', 'suitable recommendations', 'disclosure of conflicts']
              },
              tags: ['ethics', 'fiduciary', 'professional responsibility'],
              explain: 'Fiduciary responsibility is central to maintaining public trust in the insurance industry.'
            }
          ]
        },
        {
          title: 'Applied Knowledge Assessment',
          order: 3,
          gateRule: { require_all: true },
          checkpoints: [
            {
              order: 1,
              kind: 'quiz' as const,
              label: 'Knowledge Check: Regulatory Fundamentals',
              prompt: 'Test your understanding of Florida insurance regulatory fundamentals. Select all correct statements.',
              choices: [
                {
                  id: 'a',
                  text: 'The Florida Department of Financial Services regulates insurance companies and agents.',
                  correct: true
                },
                {
                  id: 'b',
                  text: 'Insurance agents can begin selling immediately after applying for a license.',
                  correct: false
                },
                {
                  id: 'c',
                  text: 'Continuing education is required to maintain an active license.',
                  correct: true
                },
                {
                  id: 'd',
                  text: 'Fiduciary responsibility only applies to life insurance agents.',
                  correct: false
                }
              ],
              explain: 'Regulatory compliance and ethical responsibility apply to all insurance professionals regardless of specialization.',
              tags: ['quiz', 'regulatory', 'compliance']
            },
            {
              order: 2,
              kind: 'task' as const,
              label: '[Contrast] Agent vs. Broker Responsibilities',
              prompt: 'Compare and contrast the legal responsibilities and obligations of insurance agents versus insurance brokers in Florida.',
              tags: ['agent', 'broker', 'responsibilities', 'comparison'],
              explain: 'Understanding the distinction between agent and broker roles is essential for proper professional conduct.'
            }
          ]
        },
        {
          title: 'Advanced Application',
          order: 4,
          gateRule: { min_passed: 2 }, // Requires passing at least 2 of the checkpoints
          checkpoints: [
            {
              order: 1,
              kind: 'short_answer' as const,
              label: '[Discuss] Ethical Scenario Analysis',
              prompt: 'Analyze the following scenario: A client asks you to recommend a policy that would pay them the highest commission, even though it may not be the most suitable for their needs. Discuss the ethical considerations and proper course of action.',
              answerKey: {
                contains: ['client best interest', 'suitable recommendation', 'fiduciary duty', 'ethical violation'],
                principles: ['suitability', 'disclosure', 'professional integrity']
              },
              tags: ['ethics', 'scenario', 'suitability', 'fiduciary'],
              explain: 'This scenario tests your understanding of fiduciary duty and the principle that client interests must come before personal financial gain.'
            },
            {
              order: 2,
              kind: 'task' as const,
              label: '[Illustration] Compliance Documentation',
              prompt: 'Outline the documentation requirements for demonstrating compliance with suitability standards when recommending insurance products to clients.',
              tags: ['compliance', 'documentation', 'suitability'],
              explain: 'Proper documentation protects both the client and the professional by demonstrating due diligence.'
            },
            {
              order: 3,
              kind: 'quiz' as const,
              label: 'Practical Application Quiz',
              prompt: 'Apply your knowledge to this practical scenario. Which actions are required when a client requests a policy modification?',
              choices: [
                {
                  id: 'a',
                  text: 'Document the client request in writing',
                  correct: true
                },
                {
                  id: 'b',
                  text: 'Process the modification immediately without review',
                  correct: false
                },
                {
                  id: 'c',
                  text: 'Assess the suitability of the proposed modification',
                  correct: true
                },
                {
                  id: 'd',
                  text: 'Provide disclosure of any impacts on coverage or benefits',
                  correct: true
                }
              ],
              explain: 'Policy modifications require the same care and documentation as initial sales to ensure client protection.',
              tags: ['modification', 'documentation', 'suitability']
            }
          ]
        },
        {
          title: 'Lesson Completion',
          order: 5,
          gateRule: { require_all: true },
          checkpoints: [
            {
              order: 1,
              kind: 'ack' as const,
              label: '[Note] Mastery Achieved',
              prompt: 'Congratulations! You have successfully completed this lesson covering Florida insurance regulatory fundamentals. The knowledge and skills you have gained are essential for professional practice and will be tested on the DFS-215 examination.',
              explain: 'This completion checkpoint confirms your mastery of the lesson objectives and readiness to proceed.'
            }
          ]
        }
      ]
    };

    // Create the lesson structure in the database
    await enhancedStorage.createLessonStructure(lessonId, dfs215Structure);
    
    console.log(`✅ Successfully created DFS-215 structured content with ${dfs215Structure.stages.length} stages`);
    
    // Log structure summary
    let totalCheckpoints = 0;
    for (const stage of dfs215Structure.stages) {
      totalCheckpoints += stage.checkpoints.length;
      console.log(`   📍 Stage "${stage.title}": ${stage.checkpoints.length} checkpoints`);
    }
    console.log(`   🎯 Total: ${totalCheckpoints} checkpoints across ${dfs215Structure.stages.length} stages`);
  }

  /**
   * Populate multiple lessons with sample DFS-215 content
   */
  async populateMultipleLessons(lessonIds: string[]): Promise<void> {
    console.log(`🏗️ Populating ${lessonIds.length} lessons with DFS-215 structured content...`);
    
    for (const lessonId of lessonIds) {
      try {
        await this.populateSampleLesson(lessonId);
      } catch (error) {
        console.error(`❌ Failed to populate lesson ${lessonId}:`, error);
      }
    }
    
    console.log(`✅ Completed populating ${lessonIds.length} lessons with enhanced DFS-215 structure`);
  }

  /**
   * Get recent lessons that could benefit from DFS-215 structure
   */
  async findLessonsForEnhancement(): Promise<string[]> {
    try {
      // Get all lessons and filter for recent ones with content
      const allLessons = await storage.getAllLessons();
      const lessons = allLessons.slice(0, 10); // Get first 10 lessons
      
      // Filter lessons that have substantial content but no stages yet
      const enhancementCandidates: string[] = [];
      
      for (const lesson of lessons) {
        if (lesson.content && lesson.content.length > 500) {
          // Check if lesson already has stages
          const existingStages = await enhancedStorage.getStagesWithCheckpoints(lesson.id);
          
          if (existingStages.length === 0) {
            enhancementCandidates.push(lesson.id);
          }
        }
      }
      
      console.log(`🔍 Found ${enhancementCandidates.length} lessons ready for DFS-215 enhancement`);
      return enhancementCandidates;
      
    } catch (error) {
      console.error('Error finding lessons for enhancement:', error);
      return [];
    }
  }

  /**
   * Create sample user progress for demonstration
   */
  async createSampleProgress(
    userId: string, 
    lessonId: string,
    progressLevel: 'none' | 'partial' | 'complete' = 'partial'
  ): Promise<void> {
    const stagesWithCheckpoints = await enhancedStorage.getStagesWithCheckpoints(lessonId);
    
    if (stagesWithCheckpoints.length === 0) {
      console.log('No stages found for progress creation');
      return;
    }

    let checkpointIndex = 0;
    const totalCheckpoints = stagesWithCheckpoints.reduce((sum, stage) => sum + stage.checkpoints.length, 0);
    
    const progressTarget = progressLevel === 'none' ? 0 
      : progressLevel === 'partial' ? Math.floor(totalCheckpoints * 0.6)
      : totalCheckpoints;

    for (const stage of stagesWithCheckpoints) {
      for (const checkpoint of stage.checkpoints) {
        if (checkpointIndex < progressTarget) {
          const status = checkpoint.kind === 'quiz' 
            ? (Math.random() > 0.2 ? 'passed' : 'failed')  // 80% pass rate for quizzes
            : 'passed';
          
          await enhancedStorage.updateUserProgress(userId, checkpoint.id, {
            lessonId,
            stageId: stage.id,
            status: status as any,
            score: checkpoint.kind === 'quiz' ? (status === 'passed' ? 85 : 65) : undefined,
            attempt: {
              completedAt: new Date().toISOString(),
              method: 'demo'
            }
          });
        }
        checkpointIndex++;
      }
    }
    
    console.log(`✅ Created ${progressLevel} progress for user ${userId} (${progressTarget}/${totalCheckpoints} checkpoints)`);
  }
}

export const sampleDFS215Content = new SampleDFS215ContentService();