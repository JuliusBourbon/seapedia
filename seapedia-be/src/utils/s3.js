const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const uploadFileToS3 = async (fileBuffer, mimeType, originalName) => {
    const bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
    // Extract extension safely
    const ext = originalName ? originalName.split('.').pop() : 'bin';
    const imageKey = `products/${crypto.randomUUID()}-${Date.now()}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);

    // Construct the public URL
    const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;

    return { imageUrl, imageKey };
};

const deleteFileFromS3 = async (imageKey) => {
    if (!imageKey) return;
    
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME,
        Key: imageKey,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error('Error deleting file from S3:', error);
    }
};

module.exports = {
    uploadFileToS3,
    deleteFileFromS3,
};
