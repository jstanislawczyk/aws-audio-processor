resource "aws_lambda_function" "transcribe_files_consumer" {
  function_name = "${local.project}-transcribe-files-consumer"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.transcribe_files_consumer.arn
  filename      = data.archive_file.transcribe_files_consumer.output_path

  source_code_hash = data.archive_file.transcribe_files_consumer.output_base64sha256

  environment {
    variables = {
      REGION           = local.region
      STATE_TABLE_NAME = aws_dynamodb_table.audio_processor_state.name
    }
  }
}

resource "aws_iam_role" "transcribe_files_consumer" {
  name               = "transcribe-files-consumer"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "transcribe_files_consumer_role_attachment" {
  role       = aws_iam_role.transcribe_files_consumer.name
  policy_arn = aws_iam_policy.transcribe_files_consumer_policy.arn
}

resource "aws_iam_policy" "transcribe_files_consumer_policy" {
  name = "${local.project}-transcribe-files-consumer"

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
    }
  ]
}
EOF
}

resource "aws_lambda_permission" "allow_upload_transcript_bucket" {
  statement_id  = "AllowNotifyTranscriptFiles"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transcribe_files_consumer.arn
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.audio.arn
}

data "archive_file" "transcribe_files_consumer" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/transcribe-files-consumer/dist"
  output_path = "artifacts/transcribe-files-consumer.zip"
}
