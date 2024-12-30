resource "aws_lambda_function" "failed_processing_handler" {
  function_name = "${local.project}-failed-processing-handler"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.failed_processing_handler.arn
  filename      = data.archive_file.failed_processing_handler.output_path

  source_code_hash = data.archive_file.failed_processing_handler.output_base64sha256

  environment {
    variables = {
      REGION               = local.region
      AUDIO_JOB_TABLE_NAME = aws_dynamodb_table.audio_job.name
    }
  }
}

resource "aws_iam_role" "failed_processing_handler" {
  name               = "${local.project}-failed-processing-handler"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "failed_processing_handler_role_attachment" {
  role       = aws_iam_role.failed_processing_handler.name
  policy_arn = aws_iam_policy.failed_processing_handler_policy.arn
}

resource "aws_iam_policy" "failed_processing_handler_policy" {
  name = "${local.project}-failed-processing-handler"

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
        "dynamodb:UpdateItem"
      ],
      "Resource": "${aws_dynamodb_table.audio_job.arn}"
    }
  ]
}
EOF
}

data "archive_file" "failed_processing_handler" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/failed-processing-handler/dist"
  output_path = "artifacts/failed-processing-handler.zip"
}

