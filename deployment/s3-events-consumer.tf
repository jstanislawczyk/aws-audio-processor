resource "aws_lambda_function" "s3_events_consumer" {
  function_name = "${local.project}-s3-events-consumer"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.s3_events_consumer.arn
  filename      = data.archive_file.s3_events_consumer.output_path

  source_code_hash = data.archive_file.s3_events_consumer.output_base64sha256

  environment {
    variables = {
      REGION            = local.region
      STATE_MACHINE_ARN = aws_sfn_state_machine.audio_processor.arn
    }
  }
}

resource "aws_iam_role" "s3_events_consumer" {
  name               = "s3-events-consumer"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "s3_events_consumer_role_attachment" {
  role       = aws_iam_role.s3_events_consumer.name
  policy_arn = aws_iam_policy.s3_events_consumer_policy.arn
}

resource "aws_iam_policy" "s3_events_consumer_policy" {
  name = "${local.project}-s3-events-consumer"

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
        "states:StartExecution"
      ],
      "Resource": "${aws_sfn_state_machine.audio_processor.arn}"
    }
  ]
}
EOF
}

resource "aws_lambda_permission" "allow_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.s3_events_consumer.arn
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.audio.arn
}

data "archive_file" "s3_events_consumer" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/s3-events-consumer/dist"
  output_path = "artifacts/s3-events-consumer.zip"
}
