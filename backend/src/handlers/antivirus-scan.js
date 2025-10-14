const { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectTaggingCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * Antivirus scan handler triggered by S3 ObjectCreated events
 * 
 * NOTE: This is a placeholder implementation. In production, you should:
 * 1. Use ClamAV Lambda layer (https://github.com/upsidetravel/bucket-antivirus-function)
 * 2. Or integrate with AWS Marketplace antivirus solution
 * 3. Or use a third-party service like VirusTotal API
 * 
 * @param {Object} event - S3 event
 */
exports.handler = async (event) => {
  console.log('Antivirus Scan - Event:', JSON.stringify(event, null, 2));

  try {
    // Process each S3 record
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      console.log(`Scanning file: ${key} in bucket: ${bucket}`);

      try {
        // Get file metadata
        const getObjectCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: key
        });

        const fileData = await s3Client.send(getObjectCommand);
        const fileSize = fileData.ContentLength;
        const contentType = fileData.ContentType;

        console.log(`File metadata - Size: ${fileSize}, Type: ${contentType}`);

        // Perform virus scan
        // TODO: Integrate actual antivirus scanning here
        const scanResult = await performVirusScan(fileData.Body, key);

        if (scanResult.infected) {
          console.error(`INFECTED FILE DETECTED: ${key}`);
          
          // Delete infected file
          await s3Client.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
          }));

          // Notify user about infected file
          await notifyUserOfInfectedFile(key, scanResult);

          console.log(`Infected file deleted: ${key}`);
        } else {
          console.log(`File is clean: ${key}`);
          
          // Tag file as scanned and clean
          await s3Client.send(new PutObjectTaggingCommand({
            Bucket: bucket,
            Key: key,
            Tagging: {
              TagSet: [
                { Key: 'scanned', Value: 'true' },
                { Key: 'scan-result', Value: 'clean' },
                { Key: 'scan-timestamp', Value: new Date().toISOString() }
              ]
            }
          }));

          // Update database record if needed
          await updateFileStatus(key, 'clean');
        }

      } catch (error) {
        console.error(`Error scanning file ${key}:`, error);
        
        // Tag file with error status
        await s3Client.send(new PutObjectTaggingCommand({
          Bucket: bucket,
          Key: key,
          Tagging: {
            TagSet: [
              { Key: 'scanned', Value: 'true' },
              { Key: 'scan-result', Value: 'error' },
              { Key: 'scan-error', Value: error.message }
            ]
          }
        }));
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Scan completed' })
    };

  } catch (error) {
    console.error('Error in antivirus scan handler:', error);
    throw error;
  }
};

/**
 * Perform virus scan on file
 * 
 * TODO: Replace with actual antivirus implementation
 * Options:
 * 1. ClamAV Lambda layer
 * 2. AWS Marketplace solution
 * 3. Third-party API (VirusTotal, MetaDefender)
 */
async function performVirusScan(fileStream, filename) {
  // Placeholder implementation
  // In production, integrate with actual antivirus solution
  
  console.log(`Performing virus scan on: ${filename}`);
  
  // Simulate scan delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // For now, assume all files are clean
  // TODO: Implement actual scanning logic
  return {
    infected: false,
    virus: null,
    scanEngine: 'placeholder',
    scanTimestamp: new Date().toISOString()
  };
}

/**
 * Notify user about infected file
 */
async function notifyUserOfInfectedFile(fileKey, scanResult) {
  try {
    // Extract user ID from file key (format: uploads/{userId}/{filename})
    const userIdMatch = fileKey.match(/uploads\/([^/]+)\//);
    if (!userIdMatch) {
      console.error('Could not extract user ID from file key:', fileKey);
      return;
    }

    const userId = userIdMatch[1];

    // Get user email from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error fetching user profile:', error);
      return;
    }

    // TODO: Send email notification using AWS SES
    console.log(`Would send notification to user ${userId} (${profile.email}) about infected file`);
    
    // Log security event
    await supabase
      .from('security_events')
      .insert({
        event_type: 'infected_file_detected',
        user_id: userId,
        details: {
          file_key: fileKey,
          scan_result: scanResult,
          timestamp: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error('Error notifying user:', error);
  }
}

/**
 * Update file status in database
 */
async function updateFileStatus(fileKey, status) {
  try {
    // Update file record in database if it exists
    const { error } = await supabase
      .from('uploads')
      .update({
        scan_status: status,
        scanned_at: new Date().toISOString()
      })
      .eq('file_key', fileKey);

    if (error) {
      console.error('Error updating file status:', error);
    }
  } catch (error) {
    console.error('Error in updateFileStatus:', error);
  }
}
