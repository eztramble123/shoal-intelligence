// Temporary script to analyze listing dates from Blake AI API
const https = require('https');

async function analyzeDates() {
  const apiKey = '6lQDLdhe4i1KrGTJCAM68LXGcSet82FE';
  
  console.log('🔍 Fetching Blake AI Listings Data...\n');

  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'api.withblake.ai',
    port: 443,
    path: '/listings',
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log(`📊 Total Records: ${response.length}\n`);
          console.log('📅 LISTING DATE ANALYSIS');
          console.log('='.repeat(80));
          
          // Analyze first 15 records
          response.slice(0, 15).forEach((record, i) => {
            console.log(`\n${i + 1}. Token: ${record.ticker} (${record.name})`);
            
            // Raw listing date (Unix timestamp)
            console.log(`   Raw listingDate: ${record.listingDate}`);
            
            // Convert to readable date
            const listingDateObj = new Date(record.listingDate * 1000);
            const isValidDate = !isNaN(listingDateObj.getTime());
            
            if (isValidDate) {
              const now = new Date();
              const daysDiff = Math.floor((now - listingDateObj) / (1000 * 60 * 60 * 24));
              
              console.log(`   Converted Date: ${listingDateObj.toLocaleDateString()} ${listingDateObj.toLocaleTimeString()}`);
              console.log(`   Days Ago: ${daysDiff} days`);
            } else {
              console.log(`   ❌ Invalid Date - Unix timestamp might be incorrect`);
            }
            
            // Compare with other dates
            console.log(`   Last Updated: ${record.last_updated}`);
            console.log(`   Scraped At: ${record.scraped_at}`);
            console.log(`   Source: ${record.sourceMessage}`);
            
            if (record.exchange) {
              console.log(`   Exchange: ${record.exchange}`);
            }
            if (record.type) {
              console.log(`   Type: ${record.type}`);
            }
          });
          
          console.log('\n' + '='.repeat(80));
          console.log('📈 DATE RANGE ANALYSIS');
          console.log('='.repeat(80));
          
          // Analyze date ranges
          const validDates = response
            .map(r => new Date(r.listingDate * 1000))
            .filter(d => !isNaN(d.getTime()))
            .sort((a, b) => a - b);
          
          if (validDates.length > 0) {
            const oldest = validDates[0];
            const newest = validDates[validDates.length - 1];
            const now = new Date();
            
            console.log(`Oldest listing: ${oldest.toLocaleDateString()} (${Math.floor((now - oldest) / (1000 * 60 * 60 * 24))} days ago)`);
            console.log(`Newest listing: ${newest.toLocaleDateString()} (${Math.floor((now - newest) / (1000 * 60 * 60 * 24))} days ago)`);
            console.log(`Total valid dates: ${validDates.length} out of ${response.length}`);
            
            // Count by time periods
            const last24h = validDates.filter(d => (now - d) <= (24 * 60 * 60 * 1000)).length;
            const last7d = validDates.filter(d => (now - d) <= (7 * 24 * 60 * 60 * 1000)).length;
            const last30d = validDates.filter(d => (now - d) <= (30 * 24 * 60 * 60 * 1000)).length;
            
            console.log(`\nListings by period:`);
            console.log(`  Last 24 hours: ${last24h}`);
            console.log(`  Last 7 days: ${last7d}`);
            console.log(`  Last 30 days: ${last30d}`);
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ JSON Parse Error:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run the analysis
analyzeDates()
  .then(() => {
    console.log('\n✅ Date analysis complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error.message);
    process.exit(1);
  });