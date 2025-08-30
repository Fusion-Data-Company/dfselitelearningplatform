#!/usr/bin/env tsx

import { encyclopediaGenerator } from '../services/encyclopedia-content-generator';
import { enhancedDFS215Generator } from '../services/enhanced-dfs215-generator';
import { storage } from '../storage';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🎓 DFS-215 Encyclopedia Content Population System');
  console.log('📚 MBA-Level Textbook Quality Content Generator\n');

  try {
    switch (command) {
      case 'generate-all':
        console.log('🔥 Generating ALL encyclopedia content for DFS-215...');
        await encyclopediaGenerator.generateComprehensiveContent();
        break;
        
      case 'generate-track':
        const trackTitle = args[1];
        if (!trackTitle) {
          console.error('❌ Please specify a track title');
          console.log('Usage: npm run populate-content generate-track "Law & Ethics"');
          process.exit(1);
        }
        console.log(`📖 Generating content for track: ${trackTitle}`);
        await encyclopediaGenerator.generateSpecificTrackContent(trackTitle);
        break;
        
      case 'enhance-dfs215':
        console.log('🏛️ Enhancing ALL tracks with DFS-215 structured framework...');
        await enhancedDFS215Generator.generateEnhancedContent();
        break;
        
      case 'enhance-track':
        const enhanceTrackTitle = args[1];
        if (!enhanceTrackTitle) {
          console.error('❌ Please specify a track title');
          console.log('Usage: npm run populate-content enhance-track "Law & Ethics"');
          process.exit(1);
        }
        console.log(`🏛️ Enhancing track with DFS-215 framework: ${enhanceTrackTitle}`);
        await enhancedDFS215Generator.enhanceSpecificTrack(enhanceTrackTitle);
        break;
        
      case 'regenerate-track':
        const trackId = args[1];
        if (!trackId) {
          console.error('❌ Please specify a track ID');
          console.log('Usage: npm run populate-content regenerate-track <track-id>');
          process.exit(1);
        }
        console.log(`🔄 Regenerating content for track ID: ${trackId}`);
        await encyclopediaGenerator.regenerateTrackContent(trackId);
        break;
        
      case 'list-tracks':
        console.log('📋 Available tracks:');
        const tracks = await storage.getTracks();
        tracks.forEach(track => {
          console.log(`  • ${track.title} (ID: ${track.id})`);
        });
        break;
        
      case 'check-content':
        console.log('🔍 Checking existing content...');
        const allTracks = await storage.getTracks();
        for (const track of allTracks) {
          const modules = await storage.getModulesByTrack(track.id);
          console.log(`\n📚 ${track.title}:`);
          
          for (const module of modules) {
            const lessons = await storage.getLessonsByModule(module.id);
            console.log(`  📄 ${module.title}: ${lessons.length} lessons`);
            
            lessons.forEach(lesson => {
              const contentLength = lesson.content?.length || 0;
              const status = contentLength > 1000 ? '✅' : contentLength > 100 ? '⚠️' : '❌';
              console.log(`    ${status} ${lesson.title} (${contentLength} chars)`);
            });
          }
        }
        break;
        
      default:
        console.log('Available commands:');
        console.log('  generate-all           - Generate comprehensive content for all tracks');
        console.log('  generate-track <name>  - Generate content for specific track');
        console.log('  enhance-dfs215         - 🏛️ Enhance ALL with DFS-215 structured framework');
        console.log('  enhance-track <name>   - 🏛️ Enhance specific track with DFS-215 structure');
        console.log('  regenerate-track <id>  - Regenerate content for specific track');
        console.log('  list-tracks           - List all available tracks');
        console.log('  check-content         - Check existing content status');
        console.log('');
        console.log('Examples:');
        console.log('  npm run populate-content generate-all');
        console.log('  npm run populate-content enhance-dfs215');
        console.log('  npm run populate-content enhance-track "Law & Ethics"');
        console.log('  npm run populate-content check-content');
        break;
    }
    
    console.log('\n✅ Command completed successfully!');
    
  } catch (error) {
    console.error('❌ Error executing command:', error);
    process.exit(1);
  }
}

// Execute if run directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };