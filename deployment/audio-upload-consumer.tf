resource "aws_lambda_function" "audio_upload_consumer" {
  function_name = "${local.project}-audio-upload-consumer"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.audio_upload_consumer.arn
  filename      = data.archive_file.audio_upload_consumer.output_path

  source_code_hash = data.archive_file.audio_upload_consumer.output_base64sha256

  environment {
    variables = {
      REGION        = local.region
      SQS_QUEUE_URL = aws_sqs_queue.audio-events.id
    }
  }
}

resource "aws_iam_role" "audio_upload_consumer" {
  name               = "${local.project}-audio-upload-consumer"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "audio_upload_consumer_role_attachment" {
  role       = aws_iam_role.audio_upload_consumer.name
  policy_arn = aws_iam_policy.audio_upload_consumer_policy.arn
}

resource "aws_iam_policy" "audio_upload_consumer_policy" {
  name = "${local.project}-audio-upload-consumer"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:${local.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "${aws_sqs_queue.audio-events.arn}"
    }
  ]
}
EOF
}

resource "aws_lambda_permission" "allow_upload_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.audio_upload_consumer.arn
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.audio.arn
}

data "archive_file" "audio_upload_consumer" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/audio-upload-consumer/dist"
  output_path = "artifacts/audio-upload-consumer.zip"
}
