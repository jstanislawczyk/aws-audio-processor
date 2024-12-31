# Audio Processor

This is a simple audio processor that can be used to process audio files in AWS Cloud.

It uses AWS Lambda and AWS S3 to process the audio files. The audio files are stored in S3 and the Lambda function is triggered when a new file is uploaded to the S3 bucket.
The Lambda function processes the audio file and stores the processed file back in the S3 bucket.

## How to run the project
1. Install Node.js 20 nad Yarn (you can use NVM)
2. Go to main directory and run `yarn` to install dependencies and `yarn run build` to build the project
3. In `terraform/sns.tf`, replace `aws_sns_topic_subscription` endpoint with your email
4. In `terraform` directory, run `terraform init` to initialize the project, `terraform plan` to see the changes and `terraform apply` to apply the changes.
5. Copy API Gateway URL and use it in `apps/frontend/src/App.tsx` file to replace `apiURL` variable
6. Go to main directory and run `yarn run dev` to start the frontend application

## Architecture
![Audio Processor](https://github.com/user-attachments/assets/5dccfeb9-bad3-410d-a0f1-3df5dde3cc1f)
