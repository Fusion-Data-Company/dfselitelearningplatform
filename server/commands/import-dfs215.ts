#!/usr/bin/env node
import { importService } from '../services/import/import-service';

async function main() {
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('  DFS-215 CONTENT IMPORT TOOL');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  
  try {
    // Check for clear flag
    if (process.argv.includes('--clear')) {
      console.log('⚠️  CLEARING ALL EXISTING CONTENT...');
      await importService.clearAllContent();
      console.log('✓ All content cleared\n');
    }
    
    // Run the import
    const result = await importService.importFromDocx();
    
    // Check for errors
    if (result.errors.length > 0) {
      console.error('\n⚠️  Import completed with errors:');
      result.errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error}`);
      });
      process.exit(1);
    }
    
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed with error:', error);
    process.exit(1);
  }
}

// Run the import
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});