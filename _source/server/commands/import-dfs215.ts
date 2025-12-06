#!/usr/bin/env node
import { importService, DFS_DOCUMENTS } from '../services/import/import-service';

async function main() {
  console.log('');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('  DFS-215 FULL CONTENT IMPORT TOOL');
  console.log('  Imports all 5 compliance-approved training documents');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('');

  // Show help
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage: npx tsx server/commands/import-dfs215.ts [options]');
    console.log('');
    console.log('Options:');
    console.log('  --clear     Clear all existing content before import');
    console.log('  --status    Check document availability without importing');
    console.log('  --single    Use single-document import (legacy)');
    console.log('  --help, -h  Show this help message');
    console.log('');
    console.log('Documents expected in attached_assets/:');
    DFS_DOCUMENTS.forEach(doc => {
      console.log(`  ${doc.id}: ${doc.filename}`);
    });
    process.exit(0);
  }

  try {
    // Check status only
    if (process.argv.includes('--status')) {
      console.log('Checking document availability...\n');
      const { found, missing } = await importService.findAllDFSDocuments();

      console.log(`Found ${found.length} of ${DFS_DOCUMENTS.length} documents:\n`);

      for (const doc of found) {
        console.log(`  ✓ ${doc.id}: ${doc.title} (${doc.pages} pages)`);
      }

      if (missing.length > 0) {
        console.log('\nMissing documents:');
        for (const doc of missing) {
          console.log(`  ✗ ${doc.id}: ${doc.filename}`);
        }
      }

      console.log('');
      if (found.length === DFS_DOCUMENTS.length) {
        console.log('✅ All documents available! Ready to import.');
      } else {
        console.log('⚠️  Some documents are missing. Import may be incomplete.');
      }
      process.exit(0);
    }

    // Check for clear flag
    if (process.argv.includes('--clear')) {
      console.log('⚠️  CLEARING ALL EXISTING CONTENT...');
      await importService.clearAllContent();
      console.log('✓ All content cleared\n');
    }

    // Run the import
    let result;
    if (process.argv.includes('--single')) {
      console.log('Running single-document import (legacy mode)...\n');
      result = await importService.importFromDocx();
    } else {
      console.log('Running full multi-document import...\n');
      result = await importService.importAllDFSDocuments();
    }

    // Check for errors
    if (result.errors.length > 0) {
      console.error('\n⚠️  Import completed with errors:');
      result.errors.forEach((error: string, index: number) => {
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